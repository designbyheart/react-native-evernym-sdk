// @flow
import type {
  InvitationReceivedActionData,
  InvitationReceivedAction,
} from '../invitation/type-invitation'
import type { ReactNavigation } from '../common/type-common'
import type { Connection } from '../store/type-connection-store'
import type { OIDCAuthenticationRequest } from '../components/qr-scanner/type-qr-scanner'
import type { OpenIdConnectState } from '../open-id-connect/open-id-connect-actions'
import { claimOfferReceived } from '../claim-offer/claim-offer-store'
import { proofRequestReceived } from '../proof-request/proof-request-store'
import type { ClaimOfferPayload } from '../claim-offer/type-claim-offer'

export type QRCodeScannerScreenState = {
  isCameraEnabled: boolean,
  appState: ?string,
}

export type QRCodeScannerScreenProps = {
  historyData: Object,
  currentScreen: string,
  publicDIDs: { [publicDID: string]: Connection },
  claimOffers: { [uid: string]: ClaimOfferPayload },
  invitationReceived: (
    data: InvitationReceivedActionData
  ) => InvitationReceivedAction,
  changeEnvironmentUrl: (url: string) => void,
  openIdConnectUpdateStatus: (
    OIDCAuthenticationRequest,
    OpenIdConnectState
  ) => void,
  claimOfferReceived: typeof claimOfferReceived,
  proofRequestReceived: typeof proofRequestReceived,
} & ReactNavigation

export const MESSAGE_NO_CAMERA_PERMISSION = 'No Camera permission'

export const MESSAGE_ALLOW_CAMERA_PERMISSION =
  'Please allow connect me to access camera from camera settings'

export const MESSAGE_RESET_CONNECT_ME = 'Reset Connect.Me?'

export const MESSAGE_RESET_DETAILS = (name: string) =>
  `You are about to switch to ${name} which is a test network. This will reset Connect.Me and you will PERMANENTLY lose all of your claims and connections. Proceed?`
