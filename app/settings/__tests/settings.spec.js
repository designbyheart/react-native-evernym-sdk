// @flow
import 'react-native'
import { Platform } from 'react-native'
import React, { PureComponent } from 'react'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'
import SettingsStack, { Settings } from '../settings'
import { getStore, getNavigation } from '../../../__mocks__/static-data'
import {
  settingsRoute,
  lockTouchIdSetupRoute,
  lockEnterPinRoute,
  genRecoveryPhraseRoute,
  exportBackupFileRoute,
  aboutAppRoute,
  onfidoRoute,
} from '../../common'
import { Apptentive } from 'apptentive-react-native'
import * as feedback from '../../feedback/'

describe('user settings screen', () => {
  const store = getStore()
  let wrapper = null
  let componentInstance = null

  function getProps() {
    return {
      walletBackup: {
        encryptionKey: 'walletEncryptionKey',
        status: 'IDLE',
      },
      timeStamp: new Date().getTime(),
      currentScreen: settingsRoute,
      navigation: getNavigation(),
      selectUserAvatar: jest.fn(),
      touchIdActive: false,
      jest,
      hasVerifiedRecoveryPhrase: false,
      autoCloudBackupEnabled: false,
      navigationOptions: jest.fn(),
      walletBalance: '190009',
      lastSuccessfulBackup: store.getState().backup.lastSuccessfulBackup,
      lastSuccessfulCloudBackup: store.getState().backup
        .lastSuccessfulCloudBackup,
      generateRecoveryPhrase: jest.fn(),
      setAutoCloudBackupEnabled: jest.fn(),
      connectionHistoryBackedUp: jest.fn(),
      cloudBackupFailure: jest.fn(),
      addPendingRedirection: jest.fn(),
      hasViewedWalletError: false,
      cloudBackupStart: jest.fn(),
      viewedWalletError: jest.fn(),
      notificationCardSwipedUp: jest.fn(),
      shouldShowNotification: false,
      connections: store.getState().connections,
      history: store.getState().history,
      notificationCardPressed: jest.fn(),
    }
  }

  function setup() {
    const props = getProps()
    return { props }
  }

  beforeEach(() => {
    const { props } = setup()
    wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} />
      </Provider>
    )
    componentInstance = wrapper.root.findByType(Settings).instance
  })

  it('should render properly and snapshot should match ios platform', () => {
    const { props } = setup()
    const tree = renderer
      .create(
        <Provider store={store}>
          <Settings {...props} />
        </Provider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('should render properly and snapshot should match for android platform', () => {
    const platform = jest.mock('Platform', () => {
      const Platform = jest.requireActual('Platform')
      Platform.OS = 'android'
      return Platform
    })
    const { props } = setup()
    const tree = renderer
      .create(
        <Provider store={store}>
          <Settings {...props} />
        </Provider>
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })

  it('should not call navigation.push if settings screen is not focussed', () => {
    const { props } = setup()
    const isFocused = jest.fn().mockReturnValue(false)
    let { navigation } = props
    navigation = { ...navigation, isFocused }
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onChangePinClick()
    expect(navigation.push).not.toBeCalled()
  })

  it('should navigate to lockEnterPin screen', () => {
    const { props } = setup()
    const { navigation } = props
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onChangePinClick()
    expect(navigation.push).toHaveBeenCalledWith(lockEnterPinRoute, {
      existingPin: true,
    })
  })

  it('should not navigate to lockTouchIdSetup if settings screen is not focussed', () => {
    const { props } = setup()
    const isFocused = jest.fn().mockReturnValue(false)
    let { navigation } = props
    navigation = { ...navigation, isFocused }
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onChangeTouchId(true)
    componentInstance.onChangeTouchId(false)
    expect(navigation.push).not.toBeCalled()
  })

  it('should navigate to lockTouchIdSetup screen', () => {
    const { props } = setup()
    const { navigation } = props
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onChangeTouchId(true)
    expect(navigation.push).toHaveBeenCalledWith(lockTouchIdSetupRoute, {
      fromSettings: true,
    })
  })

  it('should navigate to genRecoveryPhrase screen', () => {
    const { props } = setup()
    let { navigation } = props
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.onBackup()
    expect(navigation.navigate).toHaveBeenCalledWith(genRecoveryPhraseRoute, {
      initialRoute: 'someRouteName',
    })
  })

  it('should not navigate to aboutApp', () => {
    const { props } = setup()
    const isFocused = jest.fn().mockReturnValue(false)
    let { navigation } = props
    navigation = { ...navigation, isFocused }
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.openAboutApp()
    expect(navigation.navigate).not.toBeCalled()
  })

  it('should navigate to aboutApp screen', () => {
    const { props } = setup()
    const { navigation } = props
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.openAboutApp()
    expect(navigation.navigate).toHaveBeenCalledWith(aboutAppRoute, {})
  })

  it('should navigate to onfido screen', () => {
    // have NativeModules.I18nManager.localeIdentifier(android) set to 'en_US'
    // in setup.js which is valid location and onfido should navigate
    Platform.OS = 'android'
    const { props } = setup()
    const { navigation } = props
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.openOnfido()
    expect(navigation.navigate).toHaveBeenCalledWith(onfidoRoute, {})
  })

  it('should not navigate to onfido screen', () => {
    // have NativeModules.SettingsManager.settings.AppleLocale(ios) set to 'en_XX'
    // in setup.js which is NOT a valid location and onfido should NOT navigate
    Platform.OS = 'ios'
    const { props } = setup()
    const { navigation } = props
    const wrapper = renderer.create(
      <Provider store={store}>
        <Settings {...props} navigation={navigation} />
      </Provider>
    )
    const componentInstance = wrapper.root.findByType(Settings).instance
    componentInstance.openOnfido()
    expect(navigation.navigate).not.toBeCalled()
  })

  it('should invoke Apptentive message center', async () => {
    const setupApptentiveSpy = jest.spyOn(feedback, 'setupApptentive')
    setupApptentiveSpy.mockImplementation(() => Promise.resolve(''))
    const presentMessageCenterSpy = jest.spyOn(
      Apptentive,
      'presentMessageCenter'
    )
    if (componentInstance) {
      await componentInstance.openFeedback()
    }
    expect(presentMessageCenterSpy).toHaveBeenCalled()
    presentMessageCenterSpy.mockRestore()
    setupApptentiveSpy.mockRestore()
  })

  it('should hide wallet backup modal', () => {
    jest.useFakeTimers()
    componentInstance &&
      componentInstance.setState({ walletBackupModalVisible: true })
    componentInstance && componentInstance.hideWalletPopupModal()
    expect(
      componentInstance && componentInstance.state.walletBackupModalVisible
    ).toBe(false)
    jest.runOnlyPendingTimers()
  })

  it('should enable TouchIdSwitch', () => {
    const { props } = setup()

    wrapper &&
      wrapper.update(
        <Provider store={store}>
          <Settings {...props} currentScreen={lockTouchIdSetupRoute} />
        </Provider>
      )
    expect(
      componentInstance && componentInstance.state.disableTouchIdSwitch
    ).toBe(true)
    wrapper &&
      wrapper.update(
        <Provider store={store}>
          <Settings {...props} currentScreen={settingsRoute} />
        </Provider>
      )
    wrapper &&
      wrapper.update(
        <Provider store={store}>
          <Settings {...props} timeStamp={new Date().getTime()} />
        </Provider>
      )
    expect(
      componentInstance && componentInstance.state.disableTouchIdSwitch
    ).toBe(false)
  })

  it('should show wallet backup modal', () => {
    const { props } = setup()

    const walletBackup = { ...props.walletBackup, status: 'SUCCESS' }
    wrapper &&
      wrapper.update(
        <Provider store={store}>
          <Settings {...props} walletBackup={walletBackup} />
        </Provider>
      )
    expect(
      componentInstance && componentInstance.state.walletBackupModalVisible
    ).toBe(true)
  })

  it('navigation options should match snapshot when navigation state index is 0', () => {
    const navigation = { state: { index: 0 } }
    expect(SettingsStack.navigationOptions({ navigation })).toMatchSnapshot()
  })

  it('navigation options should match snapshot when navigation state index is 1', () => {
    const navigation = { state: { index: 1 } }
    expect(SettingsStack.navigationOptions({ navigation })).toMatchSnapshot()
  })
})
