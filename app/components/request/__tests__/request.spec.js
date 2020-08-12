// @flow
import React from 'react'
import 'react-native'
import renderer from 'react-test-renderer'
import { Provider } from 'react-redux'
import TouchId from 'react-native-fingerprint-scanner'

import { Request } from '../request'
import type { RequestProps, ResponseTypes } from '../type-request'
import { color } from '../../../common/styles/constant'
import { lockAuthorizationHomeRoute } from '../../../common/route-constants'
import { getNavigation, getStore } from '../../../../__mocks__/static-data'

describe('<Request />', () => {
  let store
  let request
  let requestComponent
  let tree
  const accepted = 'accepted'
  const rejected = 'rejected'
  const defaultProps = {
    title: 'Hi Test User',
    message: 'Enterprise A agent wants to connect with you',
    senderLogoUrl: 'https://image.url',
    senderName: 'Enterprise A agent',
    onAction: jest.fn(),
    showErrorAlerts: false,
    testID: 'request',
    isTouchIdEnabled: true,
    pushNotificationPermissionAction: jest.fn(),
  }
  let navigation
  let route

  beforeAll(() => {
    store = getStore()
  })

  beforeEach(() => {
    navigation = getNavigation({ onSuccess: jest.fn() })
    route = {}

    // onAction = jest.fn()
    request = renderer.create(
      <Provider store={store}>
        <Request
          {...defaultProps}
          onAction={defaultProps.onAction}
          navigation={navigation}
          showErrorAlerts={defaultProps.showErrorAlerts}
          route={route}
        />
      </Provider>
    )
    tree = request.toJSON()
  })

  it('should match snapshot', () => {
    expect(tree).toMatchSnapshot()
  })
})
