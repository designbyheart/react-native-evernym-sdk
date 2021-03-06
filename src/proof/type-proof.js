// @flow

import type {
  CustomError,
  InitialTestAction,
  GenericStringObject,
  GenericObject,
  ResetAction,
  RequestedAttrsJson,
  MatchingCredential,
  AttributeNames,
} from '../common/type-common'
import type {
  SelfAttestedAttributes,
  IndySelfAttested,
  ProofRequestShowStartAction,
} from '../proof-request/type-proof-request'

export type ProofRevealedDetails = {
  primary_proof: {
    eq_proof: {
      revealed_attrs: GenericStringObject,
      a_prime: string,
      e: string,
      v: string,
      m: GenericObject,
      m1: string,
      m2: string,
    },
    ge_proofs: Array<string>,
  },
  non_revoc_proof: ?GenericObject,
}

export type IndyRequestedProof = {
  revealed_group_attrs?: {
    [string]: {
      claimUuid: string,
      values: AttributeNames,
    },
  },
  revealed_attrs?: {
    [string]: Array<string>,
  },
  unrevealed_attrs: GenericObject,
  self_attested_attrs: GenericObject,
  predicates: GenericObject,
}

export type Proof = {
  proofs: {
    [string]: {
      proof: ProofRevealedDetails,
      schema_seq_no: number,
      issuer_did: string,
    },
  },
  aggregated_proof: {
    c_hash: string,
    c_list: Array<Array<number>>,
  },
  requested_proof: IndyRequestedProof,
}

export type RequestedClaimsJson = {
  self_attested_attributes: IndySelfAttested,
  requested_attrs: IndyRequestedAttributes,
  requested_predicates: GenericObject,
}

export const UPDATE_ATTRIBUTE_CLAIM = 'UPDATE_ATTRIBUTE_CLAIM'
export type UpdateAttributeClaimAction = {
  type: typeof UPDATE_ATTRIBUTE_CLAIM,
  uid: string,
  remoteDid: string,
  requestedAttrsJson: RequestedAttrsJson,
  selfAttestedAttrs: SelfAttestedAttributes,
}

export const GENERATE_PROOF = 'GENERATE_PROOF'
export type GenerateProofAction = {
  type: typeof GENERATE_PROOF,
  uid: string,
}

export const PROOF_SUCCESS = 'PROOF_SUCCESS'
export type ProofSuccessAction = {
  type: typeof PROOF_SUCCESS,
  proof: Proof,
  uid: string,
}

export const PROOF_FAIL = 'PROOF_FAIL'
export type ProofFailAction = {
  type: typeof PROOF_FAIL,
  uid: string,
  error: CustomError,
}

export const PROOF_REQUEST_SEND_PROOF_HANDLE = 'PROOF_REQUEST_SEND_PROOF_HANDLE'
export type proofRequestDataToStoreAction = {
  type: typeof PROOF_REQUEST_SEND_PROOF_HANDLE,
  uid: string,
  proofHandle: number,
}

export const RESET_TEMP_PROOF_DATA = 'RESET_TEMP_PROOF_DATA'
export type resetTempProofDataAction = {
  type: typeof RESET_TEMP_PROOF_DATA,
  uid: string,
}

export const ERROR_SEND_PROOF = 'ERROR_SEND_PROOF'
export type ErrorSendProofFailAction = {
  type: typeof ERROR_SEND_PROOF,
  uid: string,
  remoteDid: string,
  error: CustomError,
}

export const CLEAR_ERROR_SEND_PROOF = 'CLEAR_ERROR_SEND_PROOF'
export type clearSendProofFailAction = {
  type: typeof CLEAR_ERROR_SEND_PROOF,
  uid: string,
}

export const ERROR_CODE_MISSING_ATTRIBUTE = 'P000'

export const ERROR_MISSING_ATTRIBUTE_IN_CLAIMS = (
  message: string
): CustomError => ({
  code: ERROR_CODE_MISSING_ATTRIBUTE,
  message,
})

export const RETRY_SEND_PROOF = 'RETRY_SEND_PROOF'
export type RetrySendProofAction = {
  type: typeof RETRY_SEND_PROOF,
  selfAttestedAttributes: SelfAttestedAttributes,
  updateAttributeClaimAction: UpdateAttributeClaimAction,
}

export type IndyPreparedProof = {
  attrs: {
    [attributeName: string]: ?Array<MatchingCredential | null>,
  },
  predicates: {},
  self_attested_attrs?: {},
}

export type IndyRequestedAttributes = {
  +[attributeName: string]: [string, boolean, MatchingCredential],
}

export type VcxSelectedCredentials = {
  attrs?: {
    [attributeKey: string]: {
      credential: MatchingCredential,
      tails_file?: string,
    },
  },
}

export type ProofAction =
  | GenerateProofAction
  | ProofSuccessAction
  | ProofFailAction
  | ProofRequestShowStartAction
  | InitialTestAction
  | ResetAction
  | proofRequestDataToStoreAction
  | resetTempProofDataAction
  | ErrorSendProofFailAction
  | clearSendProofFailAction

export type ProofStore = {
  +[string]: {
    proof: Proof,
    error?: CustomError,
    selfAttestedAttributes?: SelfAttestedAttributes,
    proofData?: {
      proofHandle: number,
      selfAttestedAttributes: SelfAttestedAttributes,
      error?: CustomError,
    },
  },
}
