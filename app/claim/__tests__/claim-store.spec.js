// @flow
import renderer from 'react-test-renderer'
import { put, call, select } from 'redux-saga/effects'
import { initialTestAction } from '../../common/type-common'
import claimReducer, {
  claimReceived,
  claimStorageFail,
  claimStorageSuccess,
  claimReceivedSaga,
  mapClaimToSender,
} from '../claim-store'
import { CLAIM_STORAGE_ERROR } from '../../services/error/error-code'
import { addClaim, getClaim } from '../../bridge/react-native-cxs/RNCxs'
import { getConnectionLogoUrl } from '../../store/store-selector'
import {
  claim,
  senderDid1,
  claimDefinitionSchemaSequenceNumber,
  getClaimFormat,
  senderLogoUrl1,
  myPairWiseConnectionDetails,
} from '../../../__mocks__/static-data'
import { getItem, setItem } from '../../services/secure-storage'

describe('Claim Store', () => {
  let initialState = { claimMap: {} }
  let afterClaimReceived

  beforeEach(() => {
    initialState = claimReducer(undefined, initialTestAction())
    afterClaimReceived = claimReducer(initialState, claimReceived(claim))
  })

  it('should match snapshot for claim received action', () => {
    expect(afterClaimReceived).toMatchSnapshot()
  })

  it('should match snapshot when claim storage fails', () => {
    const nextState = claimReducer(
      afterClaimReceived,
      claimStorageFail(claim.messageId, CLAIM_STORAGE_ERROR())
    )
    expect(nextState).toMatchSnapshot()
  })

  it('should match snapshot when claim storage is success', () => {
    const nextState = claimReducer(
      afterClaimReceived,
      claimStorageSuccess(claim.messageId)
    )
    expect(nextState).toMatchSnapshot()
  })

  it('claim storage workflow should work fine if storage is success', () => {
    const gen = claimReceivedSaga(claimReceived(claim))

    expect(gen.next().value).toEqual(call(addClaim, JSON.stringify(claim)))
    expect(gen.next().value).toEqual(put(claimStorageSuccess(claim.messageId)))
    expect(gen.next().value).toEqual(
      call(
        getClaim,
        JSON.stringify({
          issuer_DID: senderDid1,
          schema_seq_no: claimDefinitionSchemaSequenceNumber,
        })
      )
    )
    expect(gen.next(getClaimFormat).value).toEqual(
      select(getConnectionLogoUrl, senderDid1)
    )
    expect(gen.next(senderLogoUrl1).value).toEqual(
      put(
        mapClaimToSender(
          getClaimFormat.claim_uuid,
          senderDid1,
          myPairWiseConnectionDetails.myPairwiseDid,
          senderLogoUrl1
        )
      )
    )
    // TODO: Fix this
    gen.next()
    gen.next()

    expect(gen.next().done).toBe(true)
  })

  it('claim storage workflow works fine if storage fails', () => {
    const gen = claimReceivedSaga(claimReceived(claim))

    expect(gen.next().value).toEqual(call(addClaim, JSON.stringify(claim)))

    const error = new Error('claim storage Indy failure')
    expect(gen.throw(error).value).toEqual(
      put(claimStorageFail(claim.messageId, CLAIM_STORAGE_ERROR(error)))
    )

    expect(gen.next().done).toBe(true)
  })
})
