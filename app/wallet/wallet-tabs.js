// @flow
import React, { PureComponent } from 'react'
import { Dimensions } from 'react-native'
import { TabBarTop, createTabNavigator } from 'react-navigation'

import type { WalletTabsProps } from './type-wallet'

import { CustomView } from '../components'
import { color, font } from '../common/styles/constant'
import { receiveTabRoute, sendTabRoute, historyTabRoute } from '../common'
import WalletSendAmount from './wallet-send-amount'
import styles from './styles'
import WalletTabReceive from './wallet-tab-receive'
import WalletTabHistory from './wallet-tab-history'
import { HISTORY_TAB, HISTORY_TAB_TEST_ID } from './wallet-constants'

const { width } = Dimensions.get('window')

export default class WalletTabs extends PureComponent<WalletTabsProps, void> {
  render() {
    const outerNavigation = {
      navigation: this.props.navigation,
    }
    return <Tabs screenProps={outerNavigation} />
  }
}

const Tabs = createTabNavigator(
  {
    [receiveTabRoute]: {
      screen: WalletTabReceive,
    },
    [sendTabRoute]: {
      screen: WalletSendAmount,
    },
    // [historyTabRoute]: {
    //   screen: WalletTabHistory,
    //   navigationOptions: {
    //     tabBarLabel: HISTORY_TAB,
    //     tabBarTestIDProps: {
    //       testID: HISTORY_TAB_TEST_ID,
    //       accessible: true,
    //       accessibleLabel: HISTORY_TAB_TEST_ID,
    //       accessibilityLabel: HISTORY_TAB_TEST_ID,
    //     },
    //   },
    // },
  },
  {
    animationEnabled: true,
    backBehavior: 'none',
    swipeEnabled: true,
    lazy: false,
    initialRouteName: receiveTabRoute,
    //order: [receiveTabRoute, sendTabRoute, historyTabRoute],
    order: [receiveTabRoute, sendTabRoute],
    initialLayout: {
      height: 52,
      width,
    },
    tabBarComponent: TabBarTop,
    tabBarPosition: 'top',
    tabBarOptions: {
      allowFontScaling: false,
      activeTintColor: color.actions.font.seventh,
      inactiveTintColor: color.bg.tertiary.font.primary,
      indicatorStyle: {
        backgroundColor: color.actions.font.seventh,
        height: 3,
      },
      style: {
        backgroundColor: color.bg.tertiary.color,
        borderBottomWidth: 1,
        borderBottomColor: color.border.primary,
      },
      labelStyle: {
        fontSize: font.size.S,
        fontFamily: font.family,
        fontWeight: 'bold',
      },
    },
  }
)
