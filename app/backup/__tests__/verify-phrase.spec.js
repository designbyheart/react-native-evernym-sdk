// @flow

import React from 'react'
import renderer from 'react-test-renderer'
import { VerifyRecoveryPhrase } from '../verify-phrase'
import { getNavigation } from '../../../__mocks__/static-data'
import { settingsRoute } from '../../common'

describe('<VerifyRecoveryPhrase />', () => {
  const recoveryPassphrase = 'hello some passphrase'

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  const navigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
    state: {
      params: {
        recoveryPassphrase,
        initialRoute: settingsRoute,
      },
    },
  }

  it('should match snapshot', () => {
    const tree = renderer
      .create(
        <VerifyRecoveryPhrase
          recoveryPassphrase={{
            phrase: recoveryPassphrase,
            salt: 'salt',
            hash: 'hash',
          }}
          navigation={navigation}
          hydrateCloudBackup={jest.fn()}
          submitPassphrase={() => {}}
          resetError={() => {}}
          error={false}
        />
      )
      .toJSON()
    expect(tree).toMatchSnapshot()
  })
})
