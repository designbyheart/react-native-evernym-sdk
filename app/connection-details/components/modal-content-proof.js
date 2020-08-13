// @flow
import React, { Component } from 'react'
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  Alert,
  Platform,
  Dimensions,
  InteractionManager,
} from 'react-native'
import { ModalButtons } from '../../components/buttons/modal-buttons'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import Carousel from 'react-native-snap-carousel'

import {
  Container,
  CustomView,
  CustomButton,
  CustomText,
  Avatar,
  Icon,
  ConnectionTheme,
  Separator,
  UserAvatar,
  headerStyles,
  Loader,
} from '../../components'
import type {
  ProofRequestProps,
  AdditionalProofDataPayload,
  ProofRequestAttributeListState,
  MissingAttributes,
  ProofRequestState,
  ProofRequestAttributeListProp,
  SelfAttestedAttributes,
} from '../../proof-request/type-proof-request'
import { KeyboardAwareFlatList } from 'react-native-keyboard-aware-scroll-view'
import debounce from 'lodash.debounce'
import {
  rejectProofRequest,
  acceptProofRequest,
  ignoreProofRequest,
  proofRequestShown,
  proofRequestShowStart,
  denyProofRequest,
} from '../../proof-request/proof-request-store'
import {
  getConnectionLogoUrl,
  getUserAvatarSource,
} from '../../store/store-selector'
import { ERROR_CODE_MISSING_ATTRIBUTE } from '../../proof/type-proof'
import {
  PRIMARY_ACTION_SEND,
  PRIMARY_ACTION_GENERATE_PROOF,
  SECONDARY_ACTION_IGNORE,
  MESSAGE_MISSING_ATTRIBUTES_DESCRIPTION,
  MESSAGE_MISSING_ATTRIBUTES_TITLE,
  MESSAGE_ERROR_PROOF_GENERATION_TITLE,
  MESSAGE_ERROR_PROOF_GENERATION_DESCRIPTION,
  PROOF_STATUS,
  MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_TITLE,
  MESSAGE_ERROR_DISSATISFIED_ATTRIBUTES_DESCRIPTION,
} from '../../proof-request/type-proof-request'
import { BLANK_ATTRIBUTE_DATA_TEXT } from '../type-connection-details'
import { newConnectionSeen } from '../../connection-history/connection-history-store'
import {
  userSelfAttestedAttributes,
  updateAttributeClaim,
  getProof,
} from '../../proof/proof-store'
import type {
  GenericObject,
  GenericStringObject,
  CustomError,
} from '../../common/type-common'
import type { Attribute } from '../../push-notification/type-push-notification'
import type { Store } from '../../store/type-store'
import { customLogger } from '../../store/custom-logger'
import { scale, verticalScale, moderateScale } from 'react-native-size-matters'
import {
  colors,
  fontFamily,
  fontSizes,
  font,
} from '../../common/styles/constant'

const screenWidth = Dimensions.get('window').width
const sliderWidth = screenWidth - screenWidth * 0.1

export function generateStateForMissingAttributes(
  missingAttributes: MissingAttributes | {}
) {
  return Object.keys(missingAttributes).reduce(
    (acc, attributeName) => ({
      ...acc,
      [attributeName]: '',
    }),
    {}
  )
}

export function isInvalidValues(
  missingAttributes: MissingAttributes | {},
  userFilledValues: GenericObject
): boolean {
  return Object.keys(missingAttributes).some((attributeName) => {
    const userFilledValue = userFilledValues[attributeName]

    if (!userFilledValue) {
      return true
    }

    const adjustedUserFilledValue = userFilledValue.trim()

    if (!adjustedUserFilledValue) {
      return true
    }

    return false
  })
}

class ProofRequestAttributeList extends Component<
  ProofRequestAttributeListProp,
  ProofRequestAttributeListState
> {
  constructor(props: ProofRequestAttributeListProp) {
    super(props)
    this.canEnableGenerateProof = debounce(
      this.canEnableGenerateProof.bind(this),
      250
    )
  }

  UNSAFE_componentWillReceiveProps(nextProps: ProofRequestAttributeListProp) {
    if (this.props.missingAttributes !== nextProps.missingAttributes) {
      // once we know that there are missing attributes
      // then we generate state variable for each of them
      // because we will show user some input boxes and need to capture values
      // that user fills in them, also we need to enable generate proof button
      // once all the missing attributes are filled in by user
      this.setState(
        generateStateForMissingAttributes(nextProps.missingAttributes)
      )
    }
  }

  // this form is needed to fix flow error
  // because methods of a class are by default covariant
  // so we need an invariance to tell method signature
  canEnableGenerateProof = function () {
    const isInvalid = isInvalidValues(this.props.missingAttributes, this.state)
    this.props.canEnablePrimaryAction(!isInvalid, this.state)
  }

  onTextChange = (e, name: string) => {
    const { text } = e.nativeEvent
    this.setState(
      {
        [name]: text,
      },
      this.canEnableGenerateProof
    )
  }

  onSwipe = (item: Attribute) => {
    this.props.updateSelectedClaims(item)
  }

  keyExtractor = ({ label }: Attribute, index: number) => `${label}${index}`

  // once we are going to render multiple values
  // then we have to render view for each pair in values and
  // collect them into one wrapping view
  renderValues = ({ item, index }) => {
    if (!item.values) {
      return <View></View>
    }

    let logoUrl

    const views = Object.keys(item.values).map((label, keyIndex) => {
      const adjustedLabel = item.label.toLocaleLowerCase()
      const testID = 'proof-request-attribute-item'

      const value = item.values[label]
      const isDataEmptyString = value === ''

      if (!logoUrl) {
        logoUrl =
          value || isDataEmptyString
            ? item.claimUuid &&
              this.props.claimMap &&
              this.props.claimMap[item.claimUuid] &&
              this.props.claimMap[item.claimUuid].logoUrl
              ? { uri: this.props.claimMap[item.claimUuid].logoUrl }
              : this.props.userAvatarSource ||
                require('../../images/UserAvatar.png')
            : null
      }

      const showInputBox =
        adjustedLabel in this.props.missingAttributes && !value

      return (
        <View key={`${index}_${keyIndex}`}>
          <Text style={styles.title}>{label}</Text>
          <View>
            {showInputBox ? (
              <TextInput
                style={styles.contentInput}
                autoCorrect={false}
                blurOnSubmit={true}
                clearButtonMode="always"
                numberOfLines={3}
                multiline={true}
                maxLength={200}
                placeholder={`Enter ${label}`}
                returnKeyType="done"
                testID={`${testID}-input-${adjustedLabel}`}
                accessible={true}
                accessibilityLabel={`${testID}-input-${adjustedLabel}`}
                onChange={(e) => this.onTextChange(e, adjustedLabel)}
                editable={!this.props.disableUserInputs}
                underlineColorAndroid="transparent"
              />
            ) : // If data is empty string, show the BLANK text in gray instead
            isDataEmptyString ? (
              <Text style={styles.contentGray}>
                {BLANK_ATTRIBUTE_DATA_TEXT}
              </Text>
            ) : (
              <Text style={styles.content}>{value}</Text>
            )}
          </View>
        </View>
      )
    })

    return (
      <View key={index} style={styles.wrapper}>
        <View style={styles.textAvatarWrapper}>
          <View style={styles.textInnerWrapper}>{views}</View>
          <View style={styles.avatarInnerWrapper}>
            <Icon
              medium
              round
              resizeMode="cover"
              src={logoUrl}
              testID={`proof-requester-logo-${index}`}
            />
          </View>
        </View>
      </View>
    )
  }

  renderItem = ({ item, index }) => {
    // convert item to array of item
    let items = item

    if (!Array.isArray(items)) {
      items = [items]
    }

    return (
      <Carousel
        layout={'default'}
        sliderWidth={sliderWidth}
        itemWidth={sliderWidth}
        onSnapToItem={(swipeIndex) => this.onSwipe(items[swipeIndex])}
        data={items}
        loop={true}
        renderItem={this.renderValues}
      />
    )
  }

  render() {
    const attributes: Array<Attribute> = this.props.list
    return (
      <KeyboardAwareFlatList
        scrollEnabled
        enableOnAndroid
        style={styles.keyboardFlatList}
        data={attributes}
        keyExtractor={this.keyExtractor}
        renderItem={this.renderItem}
        extraData={this.props}
        extraScrollHeight={Platform.OS === 'ios' ? 170 : null}
      />
    )
  }
}

export function convertUserFilledValuesToSelfAttested(
  userFilledValues: GenericStringObject,
  missingAttributes: MissingAttributes | {}
): SelfAttestedAttributes {
  return Object.keys(missingAttributes).reduce((acc, name) => {
    return {
      ...acc,
      [name]: {
        name,
        data: userFilledValues[name],
        key: missingAttributes[name].key,
      },
    }
  }, {})
}

export function getPrimaryActionText(
  missingAttributes: MissingAttributes | {},
  generateProofClicked: boolean
) {
  if (generateProofClicked) {
    return PRIMARY_ACTION_SEND
  }

  return Object.keys(missingAttributes).length > 0
    ? PRIMARY_ACTION_GENERATE_PROOF
    : PRIMARY_ACTION_SEND
}

export const isPropEmpty = (prop: string) => (
  data: GenericObject | Array<Attribute>
) => {
  if (Array.isArray(data)) {
    return data.some(missingData)
  }
  return !(data[prop] || data[prop] === '')
}

export const missingData = isPropEmpty('values')

export function enablePrimaryAction(
  missingAttributes: MissingAttributes | {},
  generateProofClicked: boolean,
  allMissingAttributesFilled: boolean,
  error: ?CustomError,
  requestedAttributes: Attribute[]
) {
  // we need to decide on whether to enable Send/Generate-Proof button

  if (error) {
    return false
  }

  const missingCount = Object.keys(missingAttributes).length
  if (missingCount > 0) {
    if (allMissingAttributesFilled === false) {
      return false
    }

    if (generateProofClicked === false) {
      return true
    }
  }

  const isMissingData = requestedAttributes.some(missingData)
  if (isMissingData) {
    return false
  }

  return true
}

export function hasMissingAttributes(
  missingAttributes: MissingAttributes | {}
) {
  return Object.keys(missingAttributes).length > 0
}

export function getMissingAttributeNames(
  missingAttributes: MissingAttributes | {}
) {
  return Object.keys(missingAttributes).join(', ')
}

class ModalContentProof extends Component<
  ProofRequestProps,
  ProofRequestState
> {
  constructor(props) {
    super(props)
    if (this.props.uid) {
      props.proofRequestShowStart(this.props.uid)
    }
    this.state = {
      allMissingAttributesFilled: false,
      generateProofClicked: false,
      selfAttestedAttributes: {},
      disableUserInputs: false,
      selectedClaims: {},
      disableSendButton: false,
      interactionsDone: false,
    }
    this.onSend = this.onSend.bind(this)
  }
  convertUserFilledValuesToSelfAttested(
    userFilledValues: GenericStringObject,
    missingAttributes: MissingAttributes | {}
  ): SelfAttestedAttributes {
    return Object.keys(missingAttributes).reduce((acc, name) => {
      return {
        ...acc,
        [name]: {
          name,
          data: userFilledValues[name],
          key: missingAttributes[name].key,
        },
      }
    }, {})
  }

  componentDidUpdate(prevProps: ProofRequestProps) {
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
            text: 'Ignore',
            onPress: this.onIgnore,
          },
          {
            text: 'Reject',
            onPress: this.onDeny,
          },
        ],
        { cancelable: false }
      )
    }

    if (
      this.props.missingAttributes !== prevProps.missingAttributes &&
      hasMissingAttributes(this.props.missingAttributes)
    ) {
      Alert.alert(
        MESSAGE_MISSING_ATTRIBUTES_TITLE,
        MESSAGE_MISSING_ATTRIBUTES_DESCRIPTION(this.props.name)
      )
    }
  }

  UNSAFE_componentWillReceiveProps(nextProps: ProofRequestProps) {
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
      const selectedClaims = nextProps.data.requestedAttributes.reduce(
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
      this.setState({ selectedClaims })
    }
  }

  updateSelectedClaims = (item: Attribute) => {
    if (this.state.selectedClaims && item && item.key) {
      const selectedClaims = {
        ...this.state.selectedClaims,
        [`${item.key}`]: [item.claimUuid, true, item.cred_info],
      }
      this.setState({ selectedClaims })
    }
  }

  canEnablePrimaryAction = (
    canEnable: boolean,
    selfAttestedAttributes: GenericStringObject
  ) => {
    this.setState({
      allMissingAttributesFilled: canEnable,
      selfAttestedAttributes,
    })
  }
  updateFirstTimeClaim() {
    const selectedClaims = this.props.data.requestedAttributes.reduce(
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
    this.setState({ selectedClaims })
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

  onIgnore = () => {
    this.props.newConnectionSeen(this.props.remotePairwiseDID)
    this.props.ignoreProofRequest(this.props.uid)
    this.props.hideModal()
  }

  onReject = () => {
    this.props.rejectProofRequest(this.props.uid)
    this.props.hideModal()
  }

  onRetry = () => {
    this.props.updateAttributeClaim(
      this.props.uid,
      this.props.remotePairwiseDID,
      this.state.selectedClaims
    )
  }

  onDeny = () => {
    this.props.denyProofRequest(this.props.uid)
    this.props.hideModal()
  }

  onSend = () => {
    if (
      this.state.generateProofClicked ||
      !hasMissingAttributes(this.props.missingAttributes)
    ) {
      // if we don't find any missing attributes then
      // user will never see generate proof button and we don't need to wait for
      // generate proof button to be clicked after all attributes are filled
      // this.props.getProof(this.props.uid)
      this.setState({
        disableSendButton: true,
      })
      this.props.newConnectionSeen(this.props.remotePairwiseDID)
      this.props.updateAttributeClaim(
        this.props.uid,
        this.props.remotePairwiseDID,
        this.state.selectedClaims
      )
      this.props.hideModal()
    } else {
      this.setState({
        generateProofClicked: true,
        disableUserInputs: true,
        disableSendButton: false,
      })

      this.props.userSelfAttestedAttributes(
        convertUserFilledValuesToSelfAttested(
          this.state.selfAttestedAttributes,
          this.props.missingAttributes
        ),
        this.props.uid
      )
    }
  }

  render() {
    const {
      data,
      name,
      uid,
      isValid,
      proofStatus,
      remotePairwiseDID,
      logoUrl,
      claimMap,
      missingAttributes,
      proofGenerationError,
    } = this.props

    const primaryActionText = getPrimaryActionText(
      this.props.missingAttributes,
      this.state.generateProofClicked
    )
    const enablePrimaryActionStatus = enablePrimaryAction(
      this.props.missingAttributes,
      this.state.generateProofClicked,
      this.state.allMissingAttributesFilled,
      proofGenerationError,
      this.props.data.requestedAttributes
    )

    if (!this.state.interactionsDone) {
      return <Loader />
    }

    return (
      <View style={styles.outerModalWrapper}>
        <View style={styles.innerModalWrapper}>
          <ProofRequestAttributeList
            list={this.props.data.requestedAttributes}
            claimMap={this.props.claimMap}
            missingAttributes={this.props.missingAttributes}
            canEnablePrimaryAction={this.canEnablePrimaryAction}
            disableUserInputs={this.state.disableUserInputs}
            userAvatarSource={this.props.userAvatarSource}
            updateSelectedClaims={this.updateSelectedClaims}
          />
        </View>
        <ModalButtons
          onPress={this.onSend}
          onIgnore={this.onDeny}
          colorBackground={this.props.colorBackground}
          secondColorBackground={this.props.secondColorBackground}
          leftBtnText={'Reject'}
          rightBtnText={primaryActionText}
          disableAccept={
            !enablePrimaryActionStatus || this.state.disableSendButton
          }
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
      getProof,
      userSelfAttestedAttributes,
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
    backgroundColor: colors.cmGray5,
    paddingTop: moderateScale(12),
    borderBottomColor: colors.cmGray3,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textAvatarWrapper: {
    flexDirection: 'row',
    width: '100%',
  },
  textInnerWrapper: {
    width: '85%',
  },
  avatarWrapper: {
    marginTop: moderateScale(-15),
    width: '15%',
  },
  avatarInnerWrapper: {
    marginTop: moderateScale(12),
  },
  title: {
    fontSize: verticalScale(fontSizes.size7),
    fontWeight: '700',
    color: colors.cmGray3,
    width: '100%',
    textAlign: 'left',
    marginBottom: moderateScale(2),
    fontFamily: fontFamily,
  },
  contentInput: {
    fontSize: verticalScale(fontSizes.size5),
    height: 48,
    fontWeight: '400',
    color: colors.cmGray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  content: {
    fontSize: verticalScale(fontSizes.size5),
    marginBottom: moderateScale(12),
    fontWeight: '400',
    color: colors.cmGray1,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  contentGray: {
    fontSize: verticalScale(fontSizes.size5),
    marginTop: moderateScale(10),
    marginBottom: moderateScale(6),
    fontWeight: '400',
    color: colors.cmGray3,
    width: '100%',
    textAlign: 'left',
    fontFamily: fontFamily,
  },
  outerModalWrapper: {
    width: '100%',
    flex: 1,
  },
  innerModalWrapper: {
    flex: 1,
    backgroundColor: colors.cmGray5,
  },
  keyboardFlatList: {
    paddingLeft: '5%',
    paddingRight: '5%',
  },
})
