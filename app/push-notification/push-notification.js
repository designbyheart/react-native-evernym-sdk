// @flow
import React, { Component } from 'react'
import { View, Platform } from 'react-native'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import messaging from '@react-native-firebase/messaging'
import PushNotificationIOS from '@react-native-community/push-notification-ios'

import type {
  Notification,
  NotificationOpen,
  RemoteMessage,
} from '@react-native-firebase/app'
import type {
  PushNotificationProps,
  NotificationOpenOptions,
} from './type-push-notification'
import type { Store } from '../store/type-store'
import type { NotificationPayload } from '../common/type-common'

import {
  pushNotificationPermissionAction,
  updatePushToken,
  fetchAdditionalData,
} from './push-notification-store'
import PushNotificationNavigator from './push-notification-navigator'
import { customLogger } from '../store/custom-logger'
import { getUnacknowledgedMessages } from '../store/config-store'

export const remoteMessageParser = (message: RemoteMessage) => {
  const {
    forDID,
    uid,
    type,
    remotePairwiseDID,
    pushNotifMsgText,
    pushNotifMsgTitle,
    senderLogoUrl,
    msg,
  } = message

  return {
    forDID,
    uid,
    type,
    remotePairwiseDID,
    senderLogoUrl,
    pushNotifMsgText,
    pushNotifMsgTitle,
    msg,
  }
}

export class PushNotification extends Component<PushNotificationProps, void> {
  notificationListener = null
  initialNotificationListener = null
  refreshTokenListener = null
  notificationDisplayedListener = null
  onNotificationOpenedListener = null
  messageListener = null

  componentDidMount = async () => {
    if (Platform.OS === 'ios') {
      // Sets the current badge number on the app icon to zero. iOS only for now.
      PushNotificationIOS.setApplicationIconBadgeNumber(0)
    }

    // Removes all delivered notifications from notification center
    PushNotificationIOS.removeAllDeliveredNotifications()

    // When a notification is opened, the listener is invoked with the notification and the action that was invoked when it was clicked on.
    this.onNotificationOpenedListener = messaging().onNotificationOpenedApp(
      (notificationOpen: NotificationOpen) => {
        // Get information about the notification that was opened
        const notification: Notification = notificationOpen.data
        this.onPushNotificationReceived(remoteMessageParser(notification), {
          openMessageDirectly: true,
        })
      }
    )

    this.messageListener = messaging().onMessage((message: RemoteMessage) => {
      this.onPushNotificationReceived(remoteMessageParser(message))
    })

    try {
      // Due to the delay in the React Native bridge, the onNotification listeners will not be available at startup, so this method can be used to check to see if the application was opened by a notification.
      const notificationOpen: NotificationOpen = await messaging().getInitialNotification()

      // App was opened by a notification
      if (notificationOpen) {
        // Get information about the notification that was opened
        const notification: Notification = notificationOpen.data
        this.onPushNotificationReceived(remoteMessageParser(notification), {
          openMessageDirectly: true,
        })
      }
    } catch (e) {
      // TODO: handle error better
      customLogger.log(e)
    }
  }

  listenForTokenUpdate() {
    this.refreshTokenListener = messaging().onTokenRefresh((token) => {
      this.saveDeviceToken(token)
    })
  }

  onPushNotificationReceived(
    notificationPayload: NotificationPayload,
    notificationOpenOptions: ?NotificationOpenOptions
  ) {
    if (notificationPayload) {
      this.props.fetchAdditionalData(
        notificationPayload,
        notificationOpenOptions
      )
    }
  }

  saveDeviceToken(token: string) {
    if (token) {
      this.props.updatePushToken(token)
    }
  }

  getToken() {
    messaging()
      .getToken()
      .then((token) => {
        if (token) {
          // user has a device token
          this.saveDeviceToken(token)
        } else {
          // user doesn't have a device token
        }
      })
      .catch((e) => {
        // we didn't get a token
        // for now we can just ignore it
        // but we might need to add a feature which will remind user to give
        // permission and thereby getting token
        // or we need to retry getToken function a few times
        // TODO:KS Don't know what to do for now
      })
    this.listenForTokenUpdate()
  }

  componentDidUpdate(prevProps: PushNotificationProps) {
    if (
      this.props.isAllowed !== prevProps.isAllowed &&
      this.props.isAllowed === true
    ) {
      this.getToken()
    }
  }

  componentWillUnmount() {
    // stop listening for events
    this.notificationListener &&
      this.notificationListener.remove &&
      this.notificationListener.remove()
    this.refreshTokenListener &&
      this.refreshTokenListener.remove &&
      this.refreshTokenListener.remove()
    this.notificationDisplayedListener &&
      this.notificationDisplayedListener.remove &&
      this.notificationDisplayedListener.remove()
    this.onNotificationOpenedListener &&
      this.onNotificationOpenedListener.remove &&
      this.onNotificationOpenedListener.remove()
    this.messageListener &&
      this.messageListener.remove &&
      this.messageListener.remove()
  }

  render() {
    return (
      <PushNotificationNavigator navigateToRoute={this.props.navigateToRoute} />
    )
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      pushNotificationPermissionAction,
      updatePushToken,
      fetchAdditionalData,
      getUnacknowledgedMessages,
    },
    dispatch
  )

const mapStateToProps = (state: Store) => {
  return {
    isAllowed: state.pushNotification.isAllowed,
    pushToken: state.pushNotification.pushToken,
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(PushNotification)
