// @flow
import React, { PureComponent } from 'react'
import { StyleSheet, StatusBar, Platform } from 'react-native'
import type { CustomHeaderProps } from './type-custom-header'
import { SafeAreaView } from 'react-navigation'
import { withNavigationFocus } from 'react-navigation'
import { Header } from 'react-native-elements'

import style from '../layout/layout-style'

class CustomHeader extends PureComponent<CustomHeaderProps, void> {
  render() {
    const {
      backgroundColor,
      children,
      centerComponent,
      outerContainerStyles,
      leftComponent,
      flatHeader,
      rightComponent,
      largeHeader,
      zeroBottomBorder,
    } = this.props

    const ContainerStyles = StyleSheet.flatten([
      flatHeader ? style.zeroWidthBottomBorder : null,
    ])
    const borderStyles = StyleSheet.flatten([
      zeroBottomBorder ? style.zeroWidthBottomBorder : null,
    ])
    const ToggleLargeHeader = largeHeader ? { top: 'always' } : { top: 'never' }

    const animated = true

    return (
      <SafeAreaView style={{ backgroundColor }} forceInset={ToggleLargeHeader}>
        <Header
          backgroundColor={backgroundColor}
          outerContainerStyles={[
            outerContainerStyles,
            ContainerStyles,
            borderStyles,
          ]}
          centerComponent={centerComponent}
          leftComponent={leftComponent}
          rightComponent={rightComponent}
        >
          {children}
        </Header>
      </SafeAreaView>
    )
  }
}

export default CustomHeader
