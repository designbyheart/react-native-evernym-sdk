import React, { Component } from 'react'
import { connect } from 'react-redux'
import {
  ScrollView,
  Image,
  Animated,
  AsyncStorage,
  StatusBar,
} from 'react-native'
import { StackNavigator } from 'react-navigation'
import { Icon, Avatar } from 'react-native-elements'
import { View as AnimationView } from 'react-native-animatable'
import { Platform } from 'react-native'
import FCM, {
  FCMEvent,
  RemoteNotificationResult,
  WillPresentNotificationResult,
  NotificationType,
} from 'react-native-fcm'
// import OneSignal from 'react-native-onesignal'

import Bubbles from './bubbles'
import User from './user'
import { getUserInfo, getConnections, invitationReceived } from '../store'
import invitationData from '../invitation/data/invitation-data'
import { setItem, getItem } from '../services/secure-storage'
import { getKeyPairFromSeed, randomSeed } from '../services/keys'
import bs58 from 'bs58'
import {
  connectionDetailRoute,
  invitationRoute,
} from '../common/route-constants'

const headerLeft = (
  <Image
    style={{ marginLeft: 10 }}
    source={require('../images/icon_Menu.png')}
  />
)
const headerTitle = (
  <Image source={require('../images/icon_connectorLogo.png')} />
)
const headerRight = (
  <Image
    style={{ marginRight: 10 }}
    source={require('../images/icon_Search.png')}
  />
)

export class HomeScreenDrawer extends Component {
  static navigationOptions = ({ navigation }) => ({
    headerLeft: headerLeft,
    title: headerTitle,
    headerRight: headerRight,
    headerStyle: {
      backgroundColor: '#3F4140',
      borderBottomWidth: 0,
    },
  })

  userAllowedPushNotification = false

  constructor(props) {
    super(props)

    this.state = {
      currentRoute: 'Home',
      scrollY: new Animated.Value(0),
      isSwiping: false,
    }
  }

  componentWillMount() {
    // push notification events
    // OneSignal.addEventListener('opened', this.onOpened)
    // OneSignal.addEventListener('ids', this.onIds)
    this.registerFCM()

    // load data for home screen
    this.props.loadUserInfo()
    this.props.loadConnections()

    // TODO: Move it to the redux store and use sagas to load data
    // ensure that it runs only once, and not every time component is rendered
    Promise.all([getItem('identifier'), getItem('phone'), getItem('seed')])
      .then(([identifier, phone, seed]) => {
        if (!identifier || !phone || !seed) {
          this.enroll()
        } else {
          this.poll(identifier)
        }
      })
      .catch(error => {
        console.log(
          'LOG: getItem for identifier, phone and seed failed, ',
          error
        )
      })
  }

  componentWillUnmount() {
    // OneSignal.removeEventListener('opened', this.onOpened)
    // OneSignal.removeEventListener('ids', this.onIds)
    // stop listening for events
    this.notificationListener.remove()
    this.refreshTokenListener.remove()
  }

  registerFCM() {
    FCM.requestPermissions() // for iOS
    FCM.getFCMToken().then(token => {
      console.log('token =>>>>', token)
      // store fcm token in your server
    })

    this.notificationListener = FCM.on(FCMEvent.Notification, async notif => {
      // there are two parts of notif. notif.notification contains the notification payload, notif.data contains data payload
      if (notif.local_notification) {
        //this is a local notification
      }
      if (notif.opened_from_tray) {
        //app is open/resumed because user clicked banner
      }
      await someAsyncCall()

      if (Platform.OS === 'ios') {
        //optional
        //iOS requires developers to call completionHandler to end notification process. If you do not call it your background remote notifications could be throttled, to read more about it see the above documentation link.
        //This library handles it for you automatically with default behavior (for remote notification, finish with NoData; for WillPresent, finish depend on "show_in_foreground"). However if you want to return different result, follow the following code to override
        //notif._notificationType is available for iOS platfrom
        switch (notif._notificationType) {
          case NotificationType.Remote:
            notif.finish(RemoteNotificationResult.NewData) //other types available: RemoteNotificationResult.NewData, RemoteNotificationResult.ResultFailed
            break
          case NotificationType.NotificationResponse:
            notif.finish()
            break
          case NotificationType.WillPresent:
            notif.finish(WillPresentNotificationResult.All) //other types available: WillPresentNotificationResult.None
            break
        }
      }
    })
    this.refreshTokenListener = FCM.on(FCMEvent.RefreshToken, token => {
      console.log(token)
      // fcm token may not be available on first load, catch it here
    })
  }

  handleSwipe = isSwiping => {
    this.setState({ isSwiping })
  }

  async saveKey(key, value) {
    try {
      await AsyncStorage.setItem(key, value)
    } catch (error) {
      console.log('Error saving newCurrentRoute' + error)
    }
  }

  async getRoute() {
    try {
      const currentRoute = await AsyncStorage.getItem('newCurrentRoute')
      this.setState({ currentRoute })
    } catch (error) {
      console.log('Error retrieving newCurrentRoute' + error)
    }
  }

  async resetKey(key) {
    try {
      await AsyncStorage.removeItem(key)
    } catch (error) {
      console.log('Error saving newCurrentRoute' + error)
    }
  }

  onOpened = openResult => {
    this.props.invitationReceived()
    this.getRoute().then(() => {
      if (this.state.currentRoute !== invitationRoute) {
        this.saveKey('newCurrentRoute', invitationRoute)
        this.props.navigation.navigate(invitationRoute)
      }
    })
  }

  onIds = device => {
    setItem('pushComMethod', device.userId)
      .then(() => {
        this.userAllowedPushNotification = true
      })
      .catch(function(error) {
        console.log('LOG: onIds setItem error, ', error)
      })
  }

  poll = identifier => {
    // TODO:KS Add signature
    fetch(`https://agency.evernym.com/agent/id/${identifier}/auth`, {
      mode: 'cors',
    })
      .then(res => {
        if (res.status == 200) {
          return res.json()
        } else {
          throw new Error('Bad Request')
        }
      })
      .then(resData => {
        if (resData.status === 'NO_RESPONSE_YET') {
          this.props.invitationReceived()
          this.saveKey('newCurrentRoute', invitationRoute)
          this.props.navigation.navigate(invitationRoute)
        } else {
          window.setTimeout(() => {
            this.poll(identifier)
          }, 4000)
        }
      })
      .catch(error =>
        window.setTimeout(() => {
          this.poll(identifier)
        }, 4000)
      )
  }

  enroll = () => {
    let phoneNumber = (Math.random() * 1000000000000000000)
      .toString()
      .substring(0, 10)
    let id = randomSeed(32).substring(0, 22)
    let seed = randomSeed(32).substring(0, 32)
    let { publicKey: verKey, secretKey: signingKey } = getKeyPairFromSeed(seed)

    verKey = bs58.encode(verKey)
    this.enrollUser(phoneNumber, id, seed, verKey)
    this.poll(id)
  }

  enrollUser(phoneNumber, id, seed, verKey) {
    if (this.userAllowedPushNotification) {
      getItem('pushComMethod')
        .then(function(pushComMethod) {
          if (pushComMethod) {
            // TODO:KS Add signature
            fetch(`https://callcenter.evernym.com/agent/enroll`, {
              method: 'POST',
              mode: 'cors',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                phoneNumber,
                id,
                verKey,
                pushComMethod,
              }),
            })
              .then(res => {
                if (res.status == 200) {
                  setItem('phone', phoneNumber)
                  setItem('identifier', id)
                  setItem('seed', seed)
                } else {
                  throw new Error('Bad Request')
                }
              })
              .catch(function(error) {
                console.error('LOG: enrollUser enroll api failure, ', error)
              })
          } else {
            console.error('LOG: Device PushComMethod not present')
          }
        })
        .catch(function(error) {
          console.error('LOG: enrollUser getItem failed, ', error)
        })
    } else {
      setTimeout(() => {
        this.enrollUser(phoneNumber, id, seed, verKey)
      }, 2000)
    }
  }

  render() {
    const bubblesHeight = this.state.scrollY.interpolate({
      inputRange: [0, 5],
      outputRange: [0, -5],
      extrapolate: 'clamp',
    })

    const { user, connections } = this.props

    return (
      <Animated.ScrollView
        scrollEnabled={!this.state.isSwiping}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: this.state.scrollY } } }],
          { useNativeDriver: true }
        )}
        style={{ backgroundColor: '#3F4140' }}
      >
        <Bubbles height={bubblesHeight} connections={connections} />
        <AnimationView style={{ marginTop: 420 }}>
          <User user={user} isSwiping={this.handleSwipe} />
        </AnimationView>
      </Animated.ScrollView>
    )
  }
}

const mapStateToProps = state => ({
  user: state.user,
  connections: state.connections,
})

const mapDispatchToProps = dispatch => ({
  loadUserInfo: () => dispatch(getUserInfo()),
  loadConnections: () => dispatch(getConnections()),
  invitationReceived: () => dispatch(invitationReceived(invitationData)),
})

const mapsStateDispatch = connect(mapStateToProps, mapDispatchToProps)(
  HomeScreenDrawer
)

export default StackNavigator({
  Home: {
    screen: mapsStateDispatch,
  },
})
