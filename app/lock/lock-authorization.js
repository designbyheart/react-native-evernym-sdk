// @flow
/**
 * Intend to verify user actions
 * we will ask authorize user for some actions in app
 * either by asking for TouchId or asking user to enter pin code
 */
import React, { useCallback } from 'react'
import { View, StyleSheet } from 'react-native'
import { HeaderBackButton } from '@react-navigation/stack'

import type { StackHeaderLeftButtonProps } from '@react-navigation/stack'
import type { LockAuthorizationProps } from './type-lock'
import type { ReactNavigation } from '../common/type-common'

import LockEnter from './lock-enter'
import { lockAuthorizationHomeRoute } from '../common'
import { BackButton } from '../components/back-button/back-button'
import { headerTitleStyle } from '../components/header-title/header-title'
import { useInteractionDone } from '../hooks/use-interactions-done'
import { OrangeLoader, LoaderGif } from '../components/loader-gif/loader-gif'
import { Header } from '../components'
import { colors } from '../common/styles/constant'

export const LockAuthorization = ({
  navigation,
  route,
}: LockAuthorizationProps) => {
  const [interactionDone] = useInteractionDone()
  const onSuccess = useCallback(() => {
    const { params } = route
    params && params.onSuccess && params.onSuccess()
  }, [])

  return !interactionDone ? (
    LoaderGif
  ) : (
    <View style={styles.container}>
      <Header
        transparent={true}
        navigation={navigation}
        route={route} />
      <LockEnter onSuccess={onSuccess} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.cmWhite,
  },
})

export const lockAuthorizationScreen = {
  routeName: lockAuthorizationHomeRoute,
  screen: LockAuthorization,
}
