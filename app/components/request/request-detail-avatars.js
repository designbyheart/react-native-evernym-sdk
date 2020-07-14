// @flow
import React, { PureComponent } from 'react'
import { StyleSheet, Image, View } from 'react-native'

import { View as AnimatedView } from 'react-native-animatable'
import { CustomView, UserAvatar, Avatar } from '../../components'
import type { RequestDetailAvatarProps } from './type-request'
import type { ImageSource } from '../../common/type-common'
import { DefaultLogo } from '../default-logo/default-logo'

import { Container } from '../layout/container'
import { getConnectionLogo } from '../../store/connections-store'
import { OFFSET_4X, OFFSET_1X } from '../../common/styles'

export default class RequestDetailAvatars extends PureComponent<
  RequestDetailAvatarProps,
  void
> {
  renderAvatarWithSource = (avatarSource: number | ImageSource) => (
    <Avatar
      medium
      shadow
      src={avatarSource}
      testID={'invitation-text-avatars-invitee'}
    />
  )

  render() {
    return (
      <View
        testID={'invitation-text-container-avatars-animation'}
        accessible={true}
        accessibilityLabel={'invitation-text-container-avatars-animation'}
      >
        <CustomView center spaceBetween>
          <CustomView
            row
            vCenter
            spaceBetween
            style={[styles.avatarsContainer]}
            testID={'invitation-text-avatars-container'}
          >
            <UserAvatar>{this.renderAvatarWithSource}</UserAvatar>
            <Image
              style={styles.forwardArrow}
              source={require('../../images/connectDots.png')}
            />
            {typeof this.props.senderLogoUrl === 'string' ? (
              <Avatar
                medium
                shadow
                src={getConnectionLogo(this.props.senderLogoUrl)}
                testID={'invitation-text-avatars-inviter'}
              />
            ) : (
              <DefaultLogo
                text={this.props.senderName}
                size={76}
                fontSize={38}
                shadow={true}
              />
            )}
          </CustomView>
        </CustomView>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  avatarsContainer: {
    marginVertical: OFFSET_4X,
  },
  forwardArrow: {
    width: 60,
    height: 8,
    marginHorizontal: OFFSET_1X / 2,
  },
})
