// @flow
import { Platform } from 'react-native'
import {
  put,
  takeLatest,
  call,
  all,
  select,
  takeEvery,
  fork,
} from 'redux-saga/effects'
import type {
  Claim,
  ClaimStore,
  ClaimAction,
  ClaimReceivedAction,
  ClaimStorageFailAction,
  ClaimStorageSuccessAction,
  MapClaimToSenderAction,
  ClaimMap,
  HydrateClaimMapAction,
  HydrateClaimMapFailAction,
  ClaimWithUuid,
  ClaimReceivedVcxAction,
  ClaimVcx,
  GetClaimVcxResult,
} from './type-claim'
import {
  CLAIM_RECEIVED,
  CLAIM_STORAGE_FAIL,
  CLAIM_STORAGE_SUCCESS,
  MAP_CLAIM_TO_SENDER,
  HYDRATE_CLAIM_MAP,
  HYDRATE_CLAIM_MAP_FAIL,
  ERROR_CLAIM_HYDRATE_FAIL,
  CLAIM_RECEIVED_VCX,
  VCX_CLAIM_OFFER_STATE,
} from './type-claim'
import type { CustomError } from '../common/type-common'
import {
  addClaim,
  getClaim,
  getClaimHandleBySerializedClaimOffer,
  updateClaimOfferState,
  getClaimVcx,
} from '../bridge/react-native-cxs/RNCxs'
import { CLAIM_STORAGE_ERROR } from '../services/error/error-code'
import {
  getConnectionLogoUrl,
  getPoolConfig,
  getClaimMap,
  getClaimOffers,
  getConnectionByUserDid,
  getUseVcx,
} from '../store/store-selector'
import { setItem, getItem } from '../services/secure-storage'
import { CLAIM_MAP } from '../common/secure-storage-constants'
import { RESET } from '../common/type-common'
import { ensureVcxInitSuccess } from '../store/config-store'
import type { SerializedClaimOffer } from '../claim-offer/type-claim-offer'
import { saveSerializedClaimOffer } from '../claim-offer/claim-offer-store'
import type { Connection } from '../store/type-connection-store'

export const claimReceived = (claim: Claim): ClaimReceivedAction => ({
  type: CLAIM_RECEIVED,
  claim,
})

export const claimStorageSuccess = (
  messageId: string
): ClaimStorageSuccessAction => ({
  type: CLAIM_STORAGE_SUCCESS,
  messageId,
})

export const claimStorageFail = (
  messageId: string,
  error: CustomError
): ClaimStorageFailAction => ({
  type: CLAIM_STORAGE_FAIL,
  messageId,
  error,
})

export function* claimReceivedSaga(
  action: ClaimReceivedAction
): Generator<*, *, *> {
  const useVcx: boolean = yield select(getUseVcx)
  if (Platform.OS === 'android' || useVcx) {
    yield* claimReceivedVcxSaga(action)
    return
  }

  try {
    const { claim: { from_did: senderDID, forDID: myPairwiseDid } } = action
    const poolConfig: string = yield select(getPoolConfig)
    const claimFilterJSON: string = yield call(
      addClaim,
      JSON.stringify(action.claim),
      poolConfig
    )

    const claims: Array<ClaimWithUuid> = yield call(
      getClaim,
      claimFilterJSON,
      poolConfig
    )
    const claimMap: ClaimMap = yield select(getClaimMap)

    // There will only be one claim which will be missing from claimMap
    // thats why raising action from loop and it will run only once.
    // We had to do this because api is returning all claims issued by a particular issuer
    for (let c of claims) {
      if (!claimMap[c.claim_uuid]) {
        const logoUrl = yield select(getConnectionLogoUrl, senderDID)
        yield put(
          mapClaimToSender(c.claim_uuid, senderDID, myPairwiseDid, logoUrl)
        )
        yield put(claimStorageSuccess(action.claim.messageId))

        // persist claimMap to secure storage
        // TODO:PS: replace with fork redux-effect
        Object.assign(claimMap, {
          [c.claim_uuid]: {
            senderDID,
            myPairwiseDid,
            logoUrl,
          },
        })

        yield call(setItem, CLAIM_MAP, JSON.stringify(claimMap))
        break
      }
    }
  } catch (e) {
    // we got error while saving claim in wallet, what to do now?
    yield put(claimStorageFail(action.claim.messageId, CLAIM_STORAGE_ERROR(e)))
  }
}

export const mapClaimToSender = (
  claimUuid: string,
  senderDID: string,
  myPairwiseDID: string,
  logoUrl: string
): MapClaimToSenderAction => ({
  type: MAP_CLAIM_TO_SENDER,
  claimUuid,
  senderDID,
  myPairwiseDID,
  logoUrl,
})

export const hydrateClaimMap = (claimMap: ClaimMap) => ({
  type: HYDRATE_CLAIM_MAP,
  claimMap,
})

export const hydrateClaimMapFail = (error: CustomError) => ({
  type: HYDRATE_CLAIM_MAP_FAIL,
  error,
})

export function* hydrateClaimMapSaga(): Generator<*, *, *> {
  try {
    const fetchedClaimMap = yield call(getItem, CLAIM_MAP)
    if (fetchedClaimMap) {
      const claimMap: ClaimMap = JSON.parse(fetchedClaimMap)
      yield put(hydrateClaimMap(claimMap))
    }
  } catch (e) {
    yield put(
      hydrateClaimMapFail({
        code: ERROR_CLAIM_HYDRATE_FAIL.code,
        message: `${ERROR_CLAIM_HYDRATE_FAIL.message}:${e.message}`,
      })
    )
  }
}

export function* watchClaimReceived(): any {
  yield takeLatest(CLAIM_RECEIVED, claimReceivedSaga)
}

export const claimReceivedVcx = (claim: ClaimVcx): ClaimReceivedVcxAction => ({
  type: CLAIM_RECEIVED_VCX,
  claim,
})

export function* claimReceivedVcxSaga(
  action: ClaimReceivedAction
): Generator<*, *, *> {
  const { forDID, remotePairwiseDID, connectionHandle, uid } = action.claim
  yield* ensureVcxInitSuccess()

  // when we receive a claim we only know claim message id,
  // and user id for which claim was sent
  // but we don't know for which claim offer this claim was sent
  // so, we take out all the claim offers for the connection
  // and then check each claim offer for update and download latest message
  // for each claim offer and see which claim offer received claim
  const serializedClaimOffers: SerializedClaimOffer[] = yield select(
    getClaimOffers,
    forDID
  )
  if (connectionHandle != null) {
    for (const serializedClaimOffer of serializedClaimOffers) {
      // run each claim offer check in parallel and wait for all of them to finish
      yield fork(checkForClaim, serializedClaimOffer, connectionHandle, forDID)
    }
  }
}

export function* checkForClaim(
  serializedClaimOffer: SerializedClaimOffer,
  connectionHandle: number,
  userDID: string
): Generator<*, *, *> {
  if (serializedClaimOffer.state === VCX_CLAIM_OFFER_STATE.ACCEPTED) {
    // if claim offer is already in accepted state, then we don't want to update state
    return
  }

  try {
    const claimHandle: number = yield call(
      getClaimHandleBySerializedClaimOffer,
      serializedClaimOffer.serialized
    )
    const vcxClaimOfferState: number = yield call(
      updateClaimOfferState,
      claimHandle
    )

    if (vcxClaimOfferState === VCX_CLAIM_OFFER_STATE.ACCEPTED) {
      // once we know that this claim offer state was updated to accepted
      // that means that we downloaded the claim for this claim offer
      // and saved to wallet, now we need to know claim uuid and exact claim
      const vcxClaim: GetClaimVcxResult = yield call(getClaimVcx, claimHandle)
      const connection: ?Connection = yield select(
        getConnectionByUserDid,
        userDID
      )

      if (connection) {
        yield put(
          mapClaimToSender(
            vcxClaim.claimUuid,
            connection.senderDID,
            userDID,
            connection.logoUrl
          )
        )
        yield fork(saveClaimUuidMap)
      }

      yield put(claimStorageSuccess(serializedClaimOffer.messageId))
    }

    // since we asked vcx to update state, we should also update serialized state in redux
    // so that we don't go out of sync with vcx
    yield fork(
      saveSerializedClaimOffer,
      claimHandle,
      userDID,
      serializedClaimOffer.messageId
    )
  } catch (e) {
    // we got error while saving claim in wallet, what to do now?
    yield put(
      claimStorageFail(serializedClaimOffer.messageId, CLAIM_STORAGE_ERROR(e))
    )
  }
}

export function* saveClaimUuidMap(): Generator<*, *, *> {
  const claimMap: ClaimMap = yield select(getClaimMap)

  try {
    yield call(setItem, CLAIM_MAP, JSON.stringify(claimMap))
  } catch (e) {
    // TODO:KS what should we do if storage fails
    console.error(`Failed to store claim uuid map:${e}`)
  }
}

export function* watchClaimReceivedVcx(): any {
  yield takeEvery(CLAIM_RECEIVED_VCX, claimReceivedVcxSaga)
}

export function* watchClaim(): any {
  yield all([watchClaimReceived(), watchClaimReceivedVcx()])
}

const initialState = { claimMap: {} }

export default function claimReducer(
  state: ClaimStore = initialState,
  action: ClaimAction
) {
  switch (action.type) {
    case CLAIM_RECEIVED:
      return {
        ...state,
        [action.claim.messageId]: {
          claim: action.claim,
        },
      }

    case CLAIM_STORAGE_FAIL:
      return {
        ...state,
        [action.messageId]: {
          ...state[action.messageId],
          error: action.error,
        },
      }

    case CLAIM_STORAGE_SUCCESS: {
      const { [action.messageId]: deleted, ...newState } = state
      return newState
    }

    case MAP_CLAIM_TO_SENDER:
      const { claimUuid, senderDID, myPairwiseDID, logoUrl } = action
      return {
        ...state,
        claimMap: {
          ...state.claimMap,
          [claimUuid]: {
            senderDID,
            myPairwiseDID,
            logoUrl,
          },
        },
      }

    case HYDRATE_CLAIM_MAP:
      return {
        ...state,
        claimMap: action.claimMap,
      }

    case RESET:
      return initialState

    default:
      return state
  }
}
