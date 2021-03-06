// @flow

// packages
import React, { Component } from 'react'
import {
  View,
  StyleSheet,
  Alert,
  Platform,
  InteractionManager,
} from 'react-native'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { moderateScale } from 'react-native-size-matters'

// types
import type {
  ProofRequestState,
  ProofRequestAndHeaderProps,
} from '../../proof-request/type-proof-request'
import {
  MESSAGE_MISSING_ATTRIBUTES_DESCRIPTION,
  MESSAGE_MISSING_ATTRIBUTES_TITLE,
  MESSAGE_ERROR_PROOF_GENERATION_TITLE,
  MESSAGE_ERROR_PROOF_GENERATION_DESCRIPTION,
  PROOF_STATUS,
  MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_TITLE,
  MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_DESCRIPTION,
  PRIMARY_ACTION_SEND,
} from '../../proof-request/type-proof-request'
import type { SelectedAttribute } from '../../push-notification/type-push-notification'

// store
import {
  getConnectionLogoUrl,
  getUserAvatarSource,
} from '../../store/store-selector'
import {
  rejectProofRequest,
  acceptProofRequest,
  ignoreProofRequest,
  proofRequestShown,
  proofRequestShowStart,
  denyProofRequest,
  applyAttributesForPresentationRequest,
  deleteOutofbandPresentationRequest,
} from '../../proof-request/proof-request-store'
import { newConnectionSeen } from '../../connection-history/connection-history-store'
import {
  updateAttributeClaim,
  getProof,
} from '../../proof/proof-store'
import type { Store } from '../../store/type-store'
import { acceptOutOfBandInvitation } from '../../invitation/invitation-store'

// components
import { ModalButtons } from '../../components/buttons/modal-buttons'
import { Loader } from '../../components'
import ProofRequestAttributeList from './proof-request-attribute-list'

// styles
import { colors } from '../../common/styles/constant'

// utils
import {
  enablePrimaryAction,
  hasMissingAttributes,
} from '../utils'

class ModalContentProof extends Component<
  ProofRequestAndHeaderProps,
  ProofRequestState & { scheduledDeletion: boolean }
> {
  constructor(props) {
    super(props)
    if (this.props.uid) {
      props.proofRequestShowStart(this.props.uid)
    }

    this.state = {
      allMissingAttributesFilled: !hasMissingAttributes(
        this.props.missingAttributes
      ),
      disableUserInputs: false,
      disableSendButton: false,
      interactionsDone: false,
      scheduledDeletion: false,
      attributesFilledFromCredential: {},
      attributesFilledByUser: {},
    }
    this.onSend = this.onSend.bind(this)
  }

  componentDidUpdate(prevProps: ProofRequestAndHeaderProps) {
    if (
      prevProps.dissatisfiedAttributes !== this.props.dissatisfiedAttributes &&
      this.props.dissatisfiedAttributes.length > 0
    ) {
      Alert.alert(
        MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_TITLE,
        MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_DESCRIPTION(
          this.props.dissatisfiedAttributes,
          this.props.name
        ),
        [
          {
            text: 'Ok',
            onPress: this.onIgnore,
          },
        ]
      )
      this.setState({
        disableSendButton: true,
      })
      return
    }

    if (
      this.props.dissatisfiedAttributes.length === 0 &&
      this.props.missingAttributes !== prevProps.missingAttributes &&
      hasMissingAttributes(this.props.missingAttributes)
    ) {
      Alert.alert(
        MESSAGE_MISSING_ATTRIBUTES_TITLE,
        MESSAGE_MISSING_ATTRIBUTES_DESCRIPTION(this.props.name)
      )
      this.setState({
        disableSendButton: true,
      })
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: ProofRequestAndHeaderProps) {
    if (
      (this.props.proofGenerationError !== nextProps.proofGenerationError &&
        nextProps.proofGenerationError) ||
      nextProps.proofStatus === PROOF_STATUS.SEND_PROOF_FAIL
    ) {
      setTimeout(() => {
        Alert.alert(
          MESSAGE_ERROR_PROOF_GENERATION_TITLE,
          MESSAGE_ERROR_PROOF_GENERATION_DESCRIPTION,
          [
            {
              text: 'Ok',
              onPress: () => {
                this.setState({
                  disableSendButton: false,
                })
              },
            },
          ],
          { cancelable: false }
        )
      }, 300)
    }

    if (
      this.props.errorProofSendData !== nextProps.errorProofSendData &&
      nextProps.errorProofSendData
    ) {
      setTimeout(() => {
        Alert.alert(
          MESSAGE_ERROR_PROOF_GENERATION_TITLE,
          MESSAGE_ERROR_PROOF_GENERATION_DESCRIPTION,
          [
            {
              text: 'Retry',
              onPress: () => {
                this.onRetry()
              },
            },
            {
              text: 'Cancel',
              onPress: () => {
                this.onIgnore()
              },
            },
          ],
          { cancelable: false }
        )
      }, 300)
    }
    if (
      this.props.data &&
      this.props.data.requestedAttributes !== nextProps.data.requestedAttributes
    ) {
      const attributesFilledFromCredential = nextProps.data.requestedAttributes.reduce(
        (acc, item) => {
          const items = { ...acc }
          if (Array.isArray(item)) {
            if (item[0].claimUuid) {
              items[`${item[0].key}`] = [
                item[0].claimUuid,
                true,
                item[0].cred_info,
              ]
            }
          }
          return items
        },
        {}
      )
      this.setState({ attributesFilledFromCredential })
    }
  }

  updateAttributesFilledFromCredentials = (item: SelectedAttribute) => {
    const attributesFilledFromCredential = {
      ...this.state.attributesFilledFromCredential,
      [`${item.key}`]: [item.claimUuid, true, item.cred_info],
    }
    this.setState({ attributesFilledFromCredential })

    // attribute is not self attested anymore
    if (this.state.attributesFilledByUser[item.key] !== undefined) {
      const {[item.key]: deleted, ...attributesFilledByUser} = this.state.attributesFilledByUser
      this.setState({ attributesFilledByUser })
    }
  }

  updateAttributesFilledByUser = (item: SelectedAttribute) => {
    const attributesFilledByUser = {
      ...this.state.attributesFilledByUser,
      [item.key]: item.value,
    }
    this.setState({ attributesFilledByUser })

    // attribute is not filled from credential anymore
    if (this.state.attributesFilledFromCredential[item.key] !== undefined) {
      const {[item.key]: deleted, ...attributesFilledFromCredential} = this.state.attributesFilledFromCredential
      this.setState({ attributesFilledFromCredential })
    }
  }

  canEnablePrimaryAction = (
    canEnable: boolean,
  ) => {
    this.setState({
      allMissingAttributesFilled: canEnable,
      disableSendButton: false,
    })
  }

  componentDidMount() {
    this.props.proofRequestShown(this.props.uid)
    this.props.getProof(this.props.uid)
    InteractionManager.runAfterInteractions(() => {
      this.setState({
        interactionsDone: true,
      })
    })
  }

  componentWillUnmount() {
    if (this.state.scheduledDeletion) {
      this.props.deleteOutofbandPresentationRequest(this.props.uid)
    }
  }

  onIgnore = () => {
    if (this.props.invitationPayload) {
      this.setState({ scheduledDeletion: true })
    } else {
      this.props.newConnectionSeen(this.props.remotePairwiseDID)
      this.props.ignoreProofRequest(this.props.uid)
    }
  }

  onReject = () => {
    if (this.props.invitationPayload) {
      this.setState({ scheduledDeletion: true })
    } else {
      this.props.rejectProofRequest(this.props.uid)
    }

    this.props.hideModal()
  }

  onRetry = () => {
    this.props.updateAttributeClaim(
      this.props.uid,
      this.props.remotePairwiseDID,
      this.state.attributesFilledFromCredential,
      this.state.attributesFilledByUser,
    )
  }

  onDeny = () => {
    if (this.props.invitationPayload) {
      this.setState({ scheduledDeletion: true })
    } else {
      this.props.denyProofRequest(this.props.uid)
    }

    this.props.hideModal()
  }

  onSend = () => {
    // if we don't find any missing attributes then
    // user will never see generate proof button and we don't need to wait for
    // generate proof button to be clicked after all attributes are filled
    // this.props.getProof(this.props.uid)
    this.setState({
      disableSendButton: true,
    })
    this.props.newConnectionSeen(this.props.remotePairwiseDID)

    if (this.props.invitationPayload) {
      // if properties contains invitation it means we accepted out-of-band presentation request
      this.props.acceptOutOfBandInvitation(
        this.props.invitationPayload,
        this.props.attachedRequest
      )
      this.props.applyAttributesForPresentationRequest(
        this.props.uid,
        this.state.attributesFilledFromCredential,
        this.state.attributesFilledByUser,
      )
    } else {
      this.props.updateAttributeClaim(
        this.props.uid,
        this.props.remotePairwiseDID,
        this.state.attributesFilledFromCredential,
        this.state.attributesFilledByUser,
      )
    }

    this.props.hideModal()
  }

  render() {
    const {
      claimMap,
      missingAttributes,
      proofGenerationError,
      userAvatarSource,
      institutionalName,
      credentialName,
      credentialText,
      imageUrl,
      colorBackground,
      secondColorBackground,
      navigation,
      route,
    } = this.props

    const enablePrimaryActionStatus = enablePrimaryAction(
      this.props.missingAttributes,
      this.state.allMissingAttributesFilled,
      proofGenerationError,
      this.props.data.requestedAttributes
    )

    if (!this.state.interactionsDone) {
      return <Loader />
    }

    const {
      canEnablePrimaryAction,
      updateAttributesFilledFromCredentials,
      updateAttributesFilledByUser
    } = this
    const { disableUserInputs } = this.state

    return (
      <View style={styles.outerModalWrapper}>
        <View style={styles.innerModalWrapper}>
          <ProofRequestAttributeList
            list={this.props.data.requestedAttributes}
            {...{
              claimMap,
              missingAttributes,
              canEnablePrimaryAction,
              disableUserInputs,
              userAvatarSource,
              updateAttributesFilledFromCredentials,
              updateAttributesFilledByUser,
              institutionalName,
              credentialName,
              credentialText,
              imageUrl,
              colorBackground,
              navigation,
              route,
              attributesFilledFromCredential: this.state.attributesFilledFromCredential,
              attributesFilledByUser: this.state.attributesFilledByUser,
            }}
          />
        </View>
        <ModalButtons
          onPress={this.onSend}
          onIgnore={this.onDeny}
          topBtnText={'Reject'}
          bottomBtnText={PRIMARY_ACTION_SEND}
          disableAccept={
            !enablePrimaryActionStatus ||
            this.state.disableSendButton ||
            (this.props.dissatisfiedAttributes &&
              this.props.dissatisfiedAttributes.length > 0)
          }
          svgIcon="Send"
          colorBackground={colors.cmGreen1}
          {...{ secondColorBackground }}
        />
      </View>
    )
  }
}

const mapStateToProps = (state: Store, mergeProps) => {
  const { proofRequest } = state
  const uid = mergeProps.uid
  const proofRequestData = proofRequest[uid] || {}
  const {
    data,
    requester = {},
    proofStatus,
    remotePairwiseDID,
    missingAttributes = {},
    dissatisfiedAttributes = [],
  } = proofRequestData
  const { name } = requester
  const isValid = proofRequestData && data && data.requestedAttributes
  const proofGenerationError = state.proof[uid] ? state.proof[uid].error : null
  const errorProofSendData =
    state.proof[uid] && state.proof[uid].proofData
      ? state.proof[uid].proofData.error
      : null

  return {
    isValid,
    data,
    logoUrl: getConnectionLogoUrl(state, remotePairwiseDID),
    name,
    uid,
    proofStatus,
    proofGenerationError,
    claimMap: state.claim.claimMap,
    missingAttributes,
    userAvatarSource: getUserAvatarSource(state.user.avatarName),
    errorProofSendData,
    remotePairwiseDID,
    dissatisfiedAttributes,
  }
}

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      proofRequestShown,
      acceptProofRequest,
      ignoreProofRequest,
      rejectProofRequest,
      updateAttributeClaim,
      acceptOutOfBandInvitation,
      applyAttributesForPresentationRequest,
      deleteOutofbandPresentationRequest,
      getProof,
      proofRequestShowStart,
      newConnectionSeen,
      denyProofRequest,
    },
    dispatch
  )
export default connect(mapStateToProps, mapDispatchToProps)(ModalContentProof)

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.cmWhite,
    paddingTop: moderateScale(12),
    ...Platform.select({
      ios: {
        borderBottomColor: colors.cmGray5,
        borderBottomWidth: StyleSheet.hairlineWidth,
      },
      android: {
        borderBottomColor: colors.cmGray5,
        borderBottomWidth: 1,
      },
    }),
  },
  avatarWrapper: {
    marginTop: moderateScale(-15),
    width: '15%',
  },
  outerModalWrapper: {
    width: '100%',
    flex: 1,
  },
  innerModalWrapper: {
    flex: 1,
    backgroundColor: colors.cmWhite,
  },
})
