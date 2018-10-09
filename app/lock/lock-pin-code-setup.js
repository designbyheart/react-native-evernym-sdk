// @flow
import React, { PureComponent } from 'react'
import { StyleSheet, InteractionManager, Keyboard } from 'react-native'
import { createStackNavigator } from 'react-navigation'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import {
  Container,
  CustomText,
  CustomButton,
  CustomView,
  PinCodeBox,
  Icon,
  CustomHeader,
} from '../components'
import {
  lockSelectionRoute,
  lockPinSetupHomeRoute,
  lockSetupSuccessRoute,
  settingsTabRoute,
  lockEnterPinRoute,
} from '../common'
import {
  color,
  OFFSET_1X,
  OFFSET_2X,
  OFFSET_6X,
  OFFSET_7X,
} from '../common/styles'
import { setPinAction, enableTouchIdAction } from './lock-store'
import type { LockPinSetupState, LockPinCodeSetupProps } from './type-lock'
import { PIN_SETUP_STATE } from './type-lock'
import { tertiaryHeaderStyles } from '../components/layout/header-styles'

const styles = StyleSheet.create({
  headerLeft: {
    width: OFFSET_2X,
  },
  title: {
    marginTop: OFFSET_6X,
    marginBottom: OFFSET_7X,
  },
  titleText: {
    lineHeight: 28,
    letterSpacing: 0.5,
    paddingHorizontal: OFFSET_1X,
  },
})

const ReEnterPinFailText = (
  <CustomText style={[styles.titleText]} center h4 bg="tertiary" tertiary thick>
    Your passcodes do not match, please start over.
  </CustomText>
)

export class LockPinSetup extends PureComponent<
  LockPinCodeSetupProps,
  LockPinSetupState
> {
  state: LockPinSetupState = {
    pinSetupState: PIN_SETUP_STATE.INITIAL,
    interactionsDone: false,
    enteredPin: null,
    pinReEnterSuccessPin: null,
    keyboardHidden: false,
  }

  pinCodeBox = null
  keyboardDidHideListener = null
  keyboardDidShowListener = null

  static navigationOptions = ({ navigation }) => ({
    header: (
      <CustomHeader flatHeader backgroundColor={color.bg.tertiary.color}>
        <CustomView>
          <Icon
            small
            testID={'back-arrow'}
            iconStyle={[styles.headerLeft]}
            src={require('../images/icon_backArrow.png')}
            resizeMode="contain"
            onPress={() =>
              navigation.state.params &&
              navigation.state.params.existingPin === true
                ? navigation.navigate(settingsTabRoute)
                : navigation.navigate(lockSelectionRoute)
            }
          />
        </CustomView>

        <CustomText bg="tertiary" tertiary transparentBg semiBold>
          App Security
        </CustomText>

        <CustomView />
      </CustomHeader>
    ),
  })

  setPinSetupStateToInitial = () => {
    this.setState({ pinSetupState: PIN_SETUP_STATE.INITIAL })
  }

  setPinSetupStateToInitialDelayed = () => {
    setTimeout(this.setPinSetupStateToInitial, 1000)
  }

  onPinSetup = (pin: string) => {
    this.props.setPinAction(pin)
    this.setState({
      pinSetupState: PIN_SETUP_STATE.INITIAL,
      pinReEnterSuccessPin: null,
      keyboardHidden: false,
    })
    this.props.navigation.state &&
    this.props.navigation.state.params &&
    this.props.navigation.state.params.existingPin === true
      ? this.props.navigation.navigate(lockSetupSuccessRoute, {
          changePin: true,
        })
      : this.props.navigation.navigate(lockSetupSuccessRoute)
  }

  onTouchIdSetup = () => {
    this.props.enableTouchIdAction()
  }

  onPinReEnterFail = () => {
    this.setState({
      pinSetupState: PIN_SETUP_STATE.REENTER_FAIL,
      enteredPin: null,
    })
    this.pinCodeBox && this.pinCodeBox.clear()
    this.setPinSetupStateToInitialDelayed()
  }

  onPinReEnterSuccess = (pin: string) => {
    this.pinCodeBox && this.pinCodeBox.hideKeyboard()
    this.setState({
      pinSetupState: PIN_SETUP_STATE.REENTER_SUCCESS,
      pinReEnterSuccessPin: pin,
    })
  }

  onKeyboardHide = (status: boolean) => {
    if (this.state.keyboardHidden !== status) {
      this.setState({
        keyboardHidden: status,
      })
    }
  }

  onFirstPinEnter = (enteredPin: string) => {
    this.setState({
      pinSetupState: PIN_SETUP_STATE.REENTER,
      enteredPin,
    })
    this.pinCodeBox && this.pinCodeBox.clear()
  }

  onPinComplete = (pin: string) => {
    if (this.state.enteredPin) {
      // if we found a entered pin, that means user is re-entering pin
      if (this.state.enteredPin === pin) {
        this.onPinReEnterSuccess(pin)
      } else {
        this.onPinReEnterFail()
      }
    } else {
      // this is the first time user has entered pin
      this.onFirstPinEnter(pin)
    }
  }

  componentDidMount() {
    this.keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        this.onKeyboardHide(true)
      }
    )
    this.keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        this.onKeyboardHide(false)
      }
    )
    InteractionManager.runAfterInteractions(() => {
      this.setState({ interactionsDone: true })
    })
  }

  componentDidUpdate(prevProps: LockPinCodeSetupProps) {
    if (
      this.state.keyboardHidden &&
      this.state.pinSetupState === PIN_SETUP_STATE.REENTER_SUCCESS &&
      this.props.navigation.isFocused
    ) {
      const pin = this.state.pinReEnterSuccessPin || ''
      this.onPinSetup(pin)
    }

    if (this.props.navigation.isFocused) {
      if (!this.keyboardDidHideListener && !this.keyboardDidShowListener) {
        this.keyboardDidHideListener = Keyboard.addListener(
          'keyboardDidHide',
          () => {
            this.onKeyboardHide(true)
          }
        )
        this.keyboardDidShowListener = Keyboard.addListener(
          'keyboardDidShow',
          () => {
            this.onKeyboardHide(false)
          }
        )
      }
    } else {
      this.keyboardDidShowListener && this.keyboardDidShowListener.remove()
      this.keyboardDidHideListener && this.keyboardDidHideListener.remove()
    }
  }

  componentWillUnmount() {
    this.keyboardDidShowListener && this.keyboardDidShowListener.remove()
    this.keyboardDidHideListener && this.keyboardDidHideListener.remove()
  }

  render() {
    const { pinSetupState, interactionsDone } = this.state
    const passCodeSetupText =
      this.props.navigation.state &&
      this.props.navigation.state.params &&
      this.props.navigation.state.params.touchIdActive === true
        ? 'Set up a passcode in case Biometrics fails'
        : 'Set up a passcode'

    const EnterPinText = (
      <CustomText
        style={[styles.titleText]}
        center
        h4
        bg="tertiary"
        tertiary
        thick
      >
        {this.props.navigation.state &&
        this.props.navigation.state.params &&
        this.props.navigation.state.params.existingPin === true
          ? 'Set up a new passcode'
          : passCodeSetupText}
      </CustomText>
    )
    const ReEnterPinText = (
      <CustomText
        style={[styles.titleText]}
        center
        h4
        bg="tertiary"
        tertiary
        thick
      >
        {this.props.navigation.state &&
        this.props.navigation.state.params &&
        this.props.navigation.state.params.existingPin === true
          ? 'Re-enter new passcode'
          : 'Re-enter passcode'}
      </CustomText>
    )

    return (
      <Container tertiary>
        <CustomView style={[styles.title]}>
          {pinSetupState === PIN_SETUP_STATE.INITIAL && EnterPinText}
          {pinSetupState === PIN_SETUP_STATE.REENTER && ReEnterPinText}
          {pinSetupState === PIN_SETUP_STATE.REENTER_FAIL && ReEnterPinFailText}
        </CustomView>
        <CustomView center>
          {interactionsDone && (
            <PinCodeBox
              ref={pinCodeBox => {
                this.pinCodeBox = pinCodeBox
              }}
              onPinComplete={this.onPinComplete}
            />
          )}
        </CustomView>
      </Container>
    )
  }
}

const mapDispatchToProps = dispatch =>
  bindActionCreators(
    {
      setPinAction,
      enableTouchIdAction,
    },
    dispatch
  )

export default createStackNavigator({
  [lockPinSetupHomeRoute]: {
    screen: connect(null, mapDispatchToProps)(LockPinSetup),
  },
})
