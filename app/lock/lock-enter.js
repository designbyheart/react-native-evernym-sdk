// @flow
import React, { Component } from 'react'
import {
  InteractionManager,
  StyleSheet,
  Platform,
  Dimensions,
  Image,
  Text,
  View,
} from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'

import {
  Container,
  CustomText,
  PinCodeBox,
  CustomView,
  Icon,
} from '../components'
import {
  color, colors, fontFamily,
  OFFSET_1X,
  OFFSET_2X,
  OFFSET_3X,
  OFFSET_4X,
} from '../common/styles'
import { CHECK_PIN_IDLE, CHECK_PIN_SUCCESS, CHECK_PIN_FAIL } from './type-lock'
import type {
  LockEnterPinProps,
  LockEnterState,
  CheckPinStatus,
  LockEnterProps,
} from './type-lock'
import {
  checkPinAction,
  checkPinStatusIdle,
  putPinFailData,
} from './lock-store'
import { switchErrorAlerts } from '../store/config-store'
import type { Store } from '../store/type-store'
import { ENTER_YOUR_PASS_CODE_MESSAGE } from '../common/message-constants'
import {
  whiteSmokeRGBA,
  whisper,
  isBiggerThanShortDevice,
  grey,
  matterhornSecondary,
  cmRed,
} from '../common/styles/constant'
import SvgCustomIcon from '../components/svg-custom-icon'
import { moderateScale } from 'react-native-size-matters'

const lockImage = require('../images/lockCombo.png')
const backgroundImg = require('../images/wave1.png')

const styles = StyleSheet.create({
  //TODO : add animations when keyboard popups.
  text: {
    marginTop: OFFSET_4X,
    minHeight: OFFSET_3X,
    marginBottom: OFFSET_4X,
  },
  titleText: {
    fontFamily,
    fontStyle: 'normal',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
})

export const WrongPinText = (
  <CustomText h4 bg="tertiary" tertiary center>
    Wrong passcode! Please try again
  </CustomText>
)

export class LockEnter extends Component<LockEnterProps, LockEnterState> {
  pinCodeBox = null
  clearFailStatus = () => {
    this.props.checkPinStatusIdle()
  }

  clearFailStatusDelayed = () => {
    setTimeout(this.clearFailStatus, 1000)
  }

  onPinComplete = (pin: string) => {
    this.props.checkPinAction(pin, this.props.isAppLocked)
  }

  componentDidUpdate(prevProps: LockEnterProps) {
    if (prevProps.shouldLockApp !== this.props.shouldLockApp) {
      this.props.putPinFailData()

      if (!this.props.shouldLockApp) {
        this.pinCodeBox && this.pinCodeBox.showKeyboard()
      }
    }

    if (this.props.checkPinStatus !== prevProps.checkPinStatus) {
      if (this.props.checkPinStatus === CHECK_PIN_SUCCESS) {
        this.pinCodeBox && this.pinCodeBox.hideKeyboard()
        this.props.onSuccess()
      } else if (this.props.checkPinStatus === CHECK_PIN_FAIL) {
        this.pinCodeBox && this.pinCodeBox.clear && this.pinCodeBox.clear()
        // set status back to idle so we can come to this else again
        this.clearFailStatusDelayed()
      }
    }
  }

  componentDidMount() {
    this.props.putPinFailData()
    if (this.props.checkPinStatus === CHECK_PIN_SUCCESS) {
      this.clearFailStatus()
    }
  }

  renderFailMessages = () => {
    if (this.props.shouldLockApp && this.props.lockdownTimeMessage) {
      return (
        <CustomView center>
          <Text style={stylesRecovery.failedAttemptsText}>
            {this.props.numberOfAttemptsMessage}
          </Text>
          <Text style={stylesRecovery.failedAttemptsText}>
            {this.props.lockdownTimeMessage}
          </Text>
        </CustomView>
      )
    } else if (
      !this.props.shouldLockApp &&
      this.props.numberOfAttemptsMessage
    ) {
      return (
        <CustomView center>
          <Text style={stylesRecovery.failedAttemptsText}>
            {this.props.numberOfAttemptsMessage}
          </Text>
        </CustomView>
      )
    } else return null
  }

  render() {
    const {
      checkPinStatus,
      message = ENTER_YOUR_PASS_CODE_MESSAGE,
    } = this.props

    const EnterPinText = (
      <CustomText
        style={[styles.titleText]}
        center
        h4
        bg="tertiary"
        tertiary
        thick
        testID="pass-code-input-text"
      >
        {message}
      </CustomText>
    )

    return (
      <Container>
        {this.props.fromRecovery ? (
          <Container safeArea fifth>
            <CustomView center>
              <SvgCustomIcon
                name="ConnectMe"
                width={moderateScale(218.54)}
                height={moderateScale(28)}
                fill={colors.cmGray2}
              />
            </CustomView>
            <Image
              source={backgroundImg}
              style={[stylesRecovery.backgroundImg]}
            />
            <CustomView
              center
              transparentBg
              style={[stylesRecovery.topLockIcon]}
            >
              <CustomView style={[stylesRecovery.blackStrip]} />
              <CustomView style={[stylesRecovery.lockIconWrapper]}>
                <Icon extraLarge halo src={lockImage} />
              </CustomView>
            </CustomView>
            <CustomView center verticalSpace>
              <CustomText
                center
                transparentBg
                style={[stylesRecovery.lockHeading]}
                heavy
                charcoal
              >
                Please enter your current Connect.Me passcode!
              </CustomText>
            </CustomView>
            <CustomView center>
              <PinCodeBox
                ref={(pinCodeBox) => {
                  this.pinCodeBox = pinCodeBox
                }}
                onPinComplete={this.onPinComplete}
              />
            </CustomView>
            <CustomView center doubleVerticalSpace>
              <CustomText
                transparentBg
                center
                h6
                bold
                style={[stylesRecovery.newPasscodeText]}
                onPress={this.props.setupNewPassCode}
                testID={'set-up-new-passcode-recovery'}
              >
                Or Set Up New Passcode
              </CustomText>
            </CustomView>
          </Container>
        ) : (
          <Container tertiary>
            <CustomView center>
              <SvgCustomIcon
                name="ConnectMe"
                width={moderateScale(218.54)}
                height={moderateScale(28)}
                fill={colors.cmGray2}
              />
            </CustomView>
            <CustomView
              style={[styles.text]}
              center
              onPress={this.props.switchErrorAlerts}
              testID="pin-code-input-boxes"
            >
              {checkPinStatus === CHECK_PIN_IDLE && EnterPinText}
              {checkPinStatus === CHECK_PIN_SUCCESS && EnterPinText}
              {checkPinStatus === CHECK_PIN_FAIL && WrongPinText}
            </CustomView>
            <CustomView center>
              {this.props.isAppLocked && this.renderFailMessages()}
              <PinCodeBox
                ref={(pinCodeBox) => {
                  this.pinCodeBox = pinCodeBox
                }}
                onPinComplete={this.onPinComplete}
                enableCustomKeyboard={this.props.enableCustomKeyboard}
                disableKeyboard={this.props.shouldLockApp}
              />
            </CustomView>
          </Container>
        )}
      </Container>
    )
  }
}

const stylesRecovery = StyleSheet.create({
  failedAttemptsText: {
    color: cmRed,
    fontSize: 17,
    fontWeight: '500',
    fontFamily: 'Lato',
  },
  backgroundImg: {
    position: 'absolute',
    transform: [{ rotate: '-180deg' }],
    marginTop: '-92%',
    width: '100%',
  },
  topLockIcon: {
    ...Platform.select({
      ios: {
        marginTop: isBiggerThanShortDevice ? '14%' : '3%',
      },
      android: {
        marginTop: '8%',
      },
    }),
  },
  blackStrip: {
    position: 'absolute',
    height: 8,
    backgroundColor: matterhornSecondary,
    width: '100%',
  },
  lockIconWrapper: {
    backgroundColor: matterhornSecondary,
    borderRadius: 50,
  },
  lockHeading: {
    fontSize: isBiggerThanShortDevice ? 23 : 16,
    width: '80%',
    ...Platform.select({
      ios: {
        marginTop: isBiggerThanShortDevice ? '7%' : '2%',
        marginBottom: '-1%',
      },
      android: {
        marginTop: isBiggerThanShortDevice ? '2%' : 0,
      },
    }),
  },
  newPasscodeText: {
    ...Platform.select({
      ios: {
        marginTop: isBiggerThanShortDevice ? '6.1%' : '1%',
      },
      android: {
        marginTop: isBiggerThanShortDevice ? '2%' : 0,
      },
    }),
    color: color.bg.fifteenth.color,
  },
})

const mapStateToProps = (state: Store) => ({
  isAppLocked: state.lock.isAppLocked,
  checkPinStatus: state.lock.checkPinStatus,
  shouldLockApp: state.lock.shouldLockApp,
  numberOfAttemptsMessage: state.lock.numberOfAttemptsMessage,
  lockdownTimeMessage: state.lock.lockdownTimeMessage,
})

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      checkPinAction,
      checkPinStatusIdle,
      switchErrorAlerts,
      putPinFailData,
    },
    dispatch
  )

export default connect(mapStateToProps, mapDispatchToProps)(LockEnter)
