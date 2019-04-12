// @flow
import React from 'react'

import type { ReactNavigation } from '../common/type-common'

import { Container, CustomView } from '../components'
import { questionStyles } from './question-screen-style'

export class QuestionScreenHeader extends React.Component<
  ReactNavigation,
  void
> {
  render() {
    // TODO:KS Add BlurView to background only for ios
    return (
      <CustomView row style={[questionStyles.headerContainer]}>
        <ViewCloser {...this.props} />
        <HeaderHandlebar />
        <ViewCloser {...this.props} />
      </CustomView>
    )
  }
}

// this component is used to close screen, when user taps on header
export const ViewCloser = (props: ReactNavigation) => (
  <Container onPress={() => props.navigation.goBack(null)} />
)

export const HeaderHandlebar = () => (
  <CustomView style={[questionStyles.headerHandleContainer]}>
    <CustomView style={[questionStyles.headerHandlebar]} />
  </CustomView>
)
