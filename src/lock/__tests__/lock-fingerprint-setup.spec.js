// @flow
import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import {
  LAErrorTouchIDUnknownError,
  LAErrorTouchIDTooManyAttempts,
  LAErrorAuthenticationFailed,
  touchIDAlerts,
} from '../type-lock'
import { LockFingerprintSetup } from '../lock-fingerprint-setup'
import {
  lockPinSetupRoute,
  lockTouchIdSetupRoute,
  lockSelectionRoute,
} from '../../common'
import { getNavigation } from '../../../__mocks__/static-data'
import { TouchId } from '../../components/touch-id/touch-id'
import * as RNCxs from '../../bridge/react-native-cxs/RNCxs'
import { Alert } from 'react-native'
import delay from '@redux-saga/delay-p'

describe('<LockFingerprintSetup />', () => {
  const getProps = () => ({
    navigation: getNavigation(),
    route: { params: { touchIdActive: true } },
    touchIdActive: true,
    fromSettings: false,
    currentScreen: lockTouchIdSetupRoute,
    disableTouchIdAction: jest.fn(),
    enableTouchIdAction: jest.fn(),
  })

  const options = {
    createNodeMock: () => {
      return {
        clear: () => {
          // eslint-disable-next-line no-unused-vars
          cleared = true
        },
      }
    },
  }

  let component
  let props
  let cleared
  let isSupportedSpy
  let authenticatesSpy

  beforeEach(() => {
    props = getProps()
    isSupportedSpy = jest.spyOn(TouchId, 'isSupported')
    isSupportedSpy.mockImplementation(() => Promise.resolve({}))
    authenticatesSpy = jest.spyOn(TouchId, 'authenticate')
    authenticatesSpy.mockImplementation(() => Promise.resolve({}))
    component = renderer.create(<LockFingerprintSetup {...props} />, options)
  })

  it('should render touchId modal', () => {
    expect(component.toJSON()).toMatchSnapshot()
  })

  it('should show use Passcode Alert ', async () => {
    component.update(<LockFingerprintSetup {...props} fromSettings={true} />)
    const alertSpy = jest.spyOn(Alert, 'alert')
    let instance = component.getInstance()
    await instance.touchIdHandler()
    expect(props.disableTouchIdAction).toHaveBeenCalled()
    expect(alertSpy).toHaveBeenCalledWith(
      null,
      touchIDAlerts.usePasscodeAlert,
      expect.anything(),
      { cancelable: false }
    )
    expect(alertSpy).toMatchSnapshot() // this will give error if the alert message is changed
    alertSpy.mockReset()
    alertSpy.mockRestore()
    isSupportedSpy.mockReset()
    authenticatesSpy.mockReset()
    isSupportedSpy.mockReset()
    authenticatesSpy.mockRestore()
  })
  it('should goto PinSetupScreen', async () => {
    let instance = component.getInstance()
    await instance.touchIdHandler()
    expect(props.enableTouchIdAction).toHaveBeenCalled()
    expect(props.navigation.navigate).toHaveBeenCalledWith(lockPinSetupRoute, {
      touchIdActive: true,
    })

    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
    authenticatesSpy.mockReset()
    authenticatesSpy.mockRestore()
  })
  it('should goto SettingsScreen', async () => {
    expect(props.enableTouchIdAction).not.toHaveBeenCalled()
    expect(props.navigation.goBack).not.toHaveBeenCalledWith(null)
    component.update(
      <LockFingerprintSetup
        {...props}
        fromSettings={true}
        touchIdActive={false}
      />
    )
    let instance = component.getInstance()
    await instance.touchIdHandler()
    expect(props.enableTouchIdAction).toHaveBeenCalled()
    expect(props.navigation.goBack).toHaveBeenCalledWith(null)
    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
    authenticatesSpy.mockReset()
    authenticatesSpy.mockRestore()
  })
  it('should show biometrics exceed alert if authentication fails', async () => {
    authenticatesSpy.mockImplementation(() =>
      Promise.reject({
        name: LAErrorTouchIDUnknownError,
        code: LAErrorTouchIDTooManyAttempts,
      })
    )

    const alertSpy = jest.spyOn(Alert, 'alert')
    let instance = component.getInstance()
    await instance.touchIdHandler()
    expect(alertSpy).toHaveBeenCalledWith(
      null,
      touchIDAlerts.biometricsExceedAlert,
      expect.anything(),
      { cancelable: false }
    )
    expect(alertSpy).toMatchSnapshot() // this will give error if the alert message is changed
    alertSpy.mockReset()
    alertSpy.mockRestore()
    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
    authenticatesSpy.mockReset()
    authenticatesSpy.mockRestore()
  })
  xit('should redirect to settings screen if authentication fails', async () => {
    authenticatesSpy.mockImplementation(() =>
      Promise.reject({
        name: LAErrorAuthenticationFailed,
        code: LAErrorAuthenticationFailed,
      })
    )
    component.update(<LockFingerprintSetup {...props} fromSettings={true} />)
    let instance = component.getInstance()
    instance.touchIdHandler()
    await delay(0)
    expect(props.navigation.goBack).toHaveBeenCalledWith(null)

    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
    authenticatesSpy.mockReset()
    authenticatesSpy.mockRestore()
  })
  it('should redirect to lock Selection screen if authentication fails', async () => {
    authenticatesSpy.mockImplementation(() =>
      Promise.reject({
        name: LAErrorAuthenticationFailed,
        code: LAErrorAuthenticationFailed,
      })
    )
    let instance = component.getInstance()
    await instance.touchIdHandler()
    expect(props.navigation.navigate).toHaveBeenCalledWith(lockSelectionRoute)

    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
    authenticatesSpy.mockReset()
    authenticatesSpy.mockRestore()
  })
  it('should show Your phone doesn’t support biometrics. alert in ios', async () => {
    isSupportedSpy.mockImplementation(() =>
      Promise.reject({ name: LAErrorTouchIDUnknownError })
    )
    const getBiometricErrorSpy = jest.spyOn(RNCxs, 'getBiometricError')
    getBiometricErrorSpy.mockImplementation(() => Promise.reject({ code: '' }))
    const alertSpy = jest.spyOn(Alert, 'alert')

    let instance = component.getInstance()
    await instance.touchIdHandler()
    expect(alertSpy).toHaveBeenCalledWith(
      null,
      touchIDAlerts.notSupportedBiometrics,
      expect.anything(),
      { cancelable: false }
    )
    expect(alertSpy).toMatchSnapshot() // this will give error if the alert message is changed

    alertSpy.mockReset()
    alertSpy.mockRestore()
    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
    getBiometricErrorSpy.mockReset()
    getBiometricErrorSpy.mockRestore()
  })
  it('should show enable biometrics alert in ios', async () => {
    isSupportedSpy.mockImplementation(() =>
      Promise.reject({ name: LAErrorTouchIDUnknownError })
    )
    const getBiometricErrorSpy = jest.spyOn(RNCxs, 'getBiometricError')
    getBiometricErrorSpy.mockImplementation(() =>
      Promise.reject({ code: 'BiometricsNotEnrolled' })
    )
    const alertSpy = jest.spyOn(Alert, 'alert')

    let instance = component.getInstance()
    await instance.touchIdHandler()
    expect(alertSpy).toHaveBeenCalledWith(
      null,
      touchIDAlerts.enableBiometrics,
      expect.anything(),
      { cancelable: false }
    )
    expect(alertSpy).toMatchSnapshot() // this will give error if the alert message is changed

    alertSpy.mockReset()
    alertSpy.mockRestore()
    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
    getBiometricErrorSpy.mockReset()
    getBiometricErrorSpy.mockRestore()
  })

  it('should show biometrics exceed alert in ios', async () => {
    isSupportedSpy.mockImplementation(() =>
      Promise.reject({ name: LAErrorTouchIDUnknownError })
    )
    const getBiometricErrorSpy = jest.spyOn(RNCxs, 'getBiometricError')
    getBiometricErrorSpy.mockImplementation(() =>
      Promise.reject({ code: 'BiometricsLockOut' })
    )
    const alertSpy = jest.spyOn(Alert, 'alert')
    let instance = component.getInstance()
    await instance.touchIdHandler()
    expect(alertSpy).toHaveBeenCalledWith(
      null,
      touchIDAlerts.biometricsExceedAlert,
      expect.anything(),
      { cancelable: false }
    )
    expect(alertSpy).toMatchSnapshot() // this will give error if the alert message is changed
    alertSpy.mockReset()
    alertSpy.mockRestore()
    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
    getBiometricErrorSpy.mockReset()
    getBiometricErrorSpy.mockRestore()
  })

  it('should test touchId handler is called', () => {
    let tree = component.toJSON()
    let instance = component.getInstance()
    //manually set to true"
    instance.touchIdHandler()
    tree = component.toJSON()
    expect(tree).toMatchSnapshot()
  })

  // need to fix this test
  // giving TypeError: Cannot read property 'showAlert' of undefined error
  xit('should show enable biometrics alert in android', async () => {
    isSupportedSpy.mockImplementationOnce(() =>
      Promise.reject({ name: LAErrorTouchIDUnknownError, code: '' })
    )

    jest.mock('Platform', () => {
      const Platform = jest.requireActual('Platform')
      Platform.OS = 'android'
      return Platform
    })
    const alertSpy = jest.spyOn(Alert, 'alert')

    let instance = component.getInstance()
    await instance.touchIdHandler()
    await delay(0)
    expect(alertSpy).toHaveBeenCalledWith(
      null,
      touchIDAlerts.enableBiometrics,
      expect.anything(),
      { cancelable: false }
    )
    expect(alertSpy).toMatchSnapshot() // this will give error if the alert message is changed

    alertSpy.mockReset()
    alertSpy.mockRestore()
    isSupportedSpy.mockReset()
    isSupportedSpy.mockRestore()
  })
})
