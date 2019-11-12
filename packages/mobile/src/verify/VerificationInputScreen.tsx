import Link from '@celo/react-components/components/Link'
import TextButton from '@celo/react-components/components/TextButton'
import TextInput from '@celo/react-components/components/TextInput'
import withTextInputPasteAware from '@celo/react-components/components/WithTextInputPasteAware'
import Checkmark from '@celo/react-components/icons/Checkmark'
import SmsCeloSwap from '@celo/react-components/icons/SmsCeloSwap'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { stripHexLeader } from '@celo/utils/src/signatureUtils'
import { extractAttestationCodeFromMessage } from '@celo/walletkit'
import dotProp from 'dot-prop-immutable'
import { padStart } from 'lodash'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CancelButton from 'src/components/CancelButton'
import DevSkipButton from 'src/components/DevSkipButton'
import i18n, { Namespaces } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { cancelVerification, receiveAttestationMessage } from 'src/identity/actions'
import { ATTESTATION_CODE_PLACEHOLDER } from 'src/identity/reducer'
import {
  AttestationCode,
  CodeInputType,
  NUM_ATTESTATIONS_REQUIRED,
  VerificationStatus,
} from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

const TAG = 'VerificationInputScreen'

const CodeInput = withTextInputPasteAware(TextInput)

function getRecodedAttestationValue(attestationCode: AttestationCode, t: i18n.TranslationFunction) {
  try {
    if (!attestationCode.code || attestationCode.code === ATTESTATION_CODE_PLACEHOLDER) {
      return t('codeAccepted')
    }
    return Buffer.from(stripHexLeader(attestationCode.code), 'hex').toString('base64')
  } catch (error) {
    Logger.warn(TAG, 'Could not recode verification code to base64')
    return t('codeAccepted')
  }
}

function CodeRow(
  index: number, // index of code in attestationCodes array
  attestationCodes: AttestationCode[], // The codes in the redux store
  isInputEnabled: boolean, // input disabled until previous code is in
  inputValue: string, // the raw code inputed by the user
  onInputChange: (value: string) => void,
  isCodeSubmitting: boolean, // is the inputted code being processed
  isCodeAccepted: boolean, // has the code been accepted and completed
  t: i18n.TranslationFunction
) {
  if (attestationCodes[index]) {
    return (
      <View style={styles.codeContainer}>
        <Text style={styles.codeValue} numberOfLines={1} ellipsizeMode={'tail'}>
          {getRecodedAttestationValue(attestationCodes[index], t)}
        </Text>
        {isCodeAccepted && (
          <View style={styles.checkmarkContainer}>
            <Checkmark height={20} width={20} />
          </View>
        )}
      </View>
    )
  }

  if (!isInputEnabled) {
    return (
      <View style={styles.codeInputDisabledContainer}>
        <Text style={styles.codeValue}>{'<#> m9oASm/3g7aZ...'}</Text>
      </View>
    )
  }

  return (
    <View style={styles.codeInputContainer}>
      <CodeInput
        value={inputValue}
        placeholder={'<#> m9oASm/3g7aZ...'}
        shouldShowClipboard={shouldShowClipboard(attestationCodes)}
        onChangeText={onInputChange}
        style={styles.codeInput}
      />
      {isCodeSubmitting && (
        <ActivityIndicator size="small" color={colors.celoGreen} style={styles.codeInputSpinner} />
      )}
    </View>
  )
}

function shouldShowClipboard(attestationCodes: AttestationCode[]) {
  return (value: string) => {
    const extractedCode = extractAttestationCodeFromMessage(value)
    return !!extractedCode && !attestationCodes.find((c) => c.code === extractedCode)
  }
}

interface StateProps {
  e164Number: string
  attestationCodes: AttestationCode[]
  numCompleteAttestations: number
  verificationStatus: VerificationStatus
  underlyingError: ErrorMessages | null | undefined
}

interface DispatchProps {
  cancelVerification: typeof cancelVerification
  receiveAttestationMessage: typeof receiveAttestationMessage
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  timer: number
  codeInputValues: string[]
  codeSubmittingStatuses: boolean[]
  isModalVisible: boolean
}

const mapDispatchToProps = {
  cancelVerification,
  receiveAttestationMessage,
  hideAlert,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    e164Number: state.account.e164PhoneNumber,
    attestationCodes: state.identity.attestationCodes,
    numCompleteAttestations: state.identity.numCompleteAttestations,
    verificationStatus: state.identity.verificationStatus,
    underlyingError: errorSelector(state),
  }
}

class VerificationInputScreen extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  interval: number | undefined

  state: State = {
    timer: 60,
    codeInputValues: [],
    codeSubmittingStatuses: [],
    isModalVisible: false,
  }

  componentDidMount() {
    this.interval = setInterval(() => {
      const timer = this.state.timer
      if (timer === 1) {
        clearInterval(this.interval)
      }
      this.setState({ timer: timer - 1 })
    }, 1000)
  }

  componentDidUpdate() {
    if (this.isVerificationComplete()) {
      return this.finishVerification()
    }
    if (this.isCodeRejected() && this.isAnyCodeSubmitting()) {
      this.setState({ codeSubmittingStatuses: [false, false, false] })
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  isVerificationComplete = () => {
    return this.props.numCompleteAttestations >= NUM_ATTESTATIONS_REQUIRED
  }

  isCodeRejected = () => {
    return (
      this.props.underlyingError === ErrorMessages.INVALID_ATTESTATION_CODE ||
      this.props.underlyingError === ErrorMessages.REPEAT_ATTESTATION_CODE
    )
  }

  isAnyCodeSubmitting = () => {
    return this.state.codeSubmittingStatuses.filter((c) => c).length > 0
  }

  finishVerification = () => {
    Logger.debug(TAG + '@finishVerification', 'Verification finished, navigating to next screen.')
    this.props.hideAlert()
    navigate(Screens.VerificationSuccessScreen)
  }

  onCancel = () => {
    Logger.debug(TAG + '@onCancel', 'Cancelled, going back to education screen')
    this.props.cancelVerification()
    navigate(Screens.VerificationEducationScreen)
  }

  onChangeInputCode = (index: number) => {
    return (value: string) => {
      // TODO(Rossy) Add test this of typing codes gradually
      this.setState(dotProp.set(this.state, `codeInputValues.${index}`, value))
      if (extractAttestationCodeFromMessage(value)) {
        this.setState(dotProp.set(this.state, `codeSubmittingStatuses.${index}`, true))
        this.props.receiveAttestationMessage(value, CodeInputType.MANUAL)
      }
    }
  }

  onPressCodesNotReceived = () => {
    this.setState({ isModalVisible: true })
  }

  onPressWaitForCodes = () => {
    this.setState({ isModalVisible: false })
  }

  onPressSkip = () => {
    this.props.cancelVerification()
    navigate(Screens.WalletHome)
  }

  render() {
    const { codeInputValues, codeSubmittingStatuses, isModalVisible, timer } = this.state
    const { t, attestationCodes, numCompleteAttestations } = this.props

    const numCodesAccepted = attestationCodes.length

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.buttonCancelContainer}>
          <CancelButton onCancel={this.onCancel} />
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <DevSkipButton nextScreen={Screens.WalletHome} />
          <View style={styles.iconContainer}>
            <SmsCeloSwap width={102} height={32} />
          </View>
          <Text style={fontStyles.h1} testID="VerificationInputHeader">
            {t('input.header')}
          </Text>
          <Text style={fontStyles.body}>
            <Text style={fontStyles.bold}>{t('input.body1')}</Text>
            {t('input.body2')}
          </Text>
          <Text style={styles.codeHeader}>{t('input.codeHeader1')}</Text>
          {CodeRow(
            0,
            attestationCodes,
            numCodesAccepted >= 0,
            codeInputValues[0],
            this.onChangeInputCode(0),
            codeSubmittingStatuses[0],
            numCompleteAttestations > 0,
            t
          )}
          <Text style={styles.codeHeader}>{t('input.codeHeader2')}</Text>
          {CodeRow(
            1,
            attestationCodes,
            numCodesAccepted >= 1,
            codeInputValues[1],
            this.onChangeInputCode(1),
            codeSubmittingStatuses[1],
            numCompleteAttestations > 1,
            t
          )}
          <Text style={styles.codeHeader}>{t('input.codeHeader3')}</Text>
          {CodeRow(
            2,
            attestationCodes,
            numCodesAccepted >= 2,
            codeInputValues[2],
            this.onChangeInputCode(2),
            codeSubmittingStatuses[2],
            numCompleteAttestations > 2,
            t
          )}
          <Link style={styles.missingCodesLink} onPress={this.onPressCodesNotReceived}>
            {t('input.codesMissing')}
          </Link>
        </ScrollView>
        <Modal isVisible={isModalVisible}>
          <View style={styles.modalContainer}>
            <View style={styles.modalTimerContainer}>
              <LoadingSpinner />
              <Text style={fontStyles.body}>{'0:' + padStart(`${timer}`, 2, '0')}</Text>
            </View>
            <Text style={styles.modalHeader}>{t('missingCodesModal.header')}</Text>
            <Text style={fontStyles.body}>{t('missingCodesModal.body')}</Text>
            <View style={styles.modalButtonsContainer}>
              <TextButton onPress={this.onPressWaitForCodes} style={styles.modalCancelText}>
                {t('missingCodesModal.wait')}
              </TextButton>
              <TextButton
                onPress={this.onPressSkip}
                style={[styles.modalSkipText, timer > 0 && styles.modalSkipTextDisabled]}
                disabled={timer > 0}
              >
                {t('missingCodesModal.skip')}
              </TextButton>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundDarker,
  },
  scrollContainer: {
    flex: 1,
    padding: 30,
    paddingTop: 0,
  },
  buttonCancelContainer: {
    position: 'absolute',
    top: 10,
    left: 5,
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  bodyBold: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
  },
  codeHeader: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    marginTop: 20,
  },
  codeContainer: {
    justifyContent: 'center',
    marginVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: colors.darkLightest,
    borderRadius: 3,
    height: 50,
  },
  checkmarkContainer: {
    backgroundColor: colors.darkLightest,
    position: 'absolute',
    top: 3,
    right: 3,
    padding: 10,
  },
  codeInputContainer: {
    position: 'relative',
  },
  codeInput: {
    flex: 0,
    backgroundColor: '#FFF',
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    marginVertical: 5,
  },
  codeInputSpinner: {
    backgroundColor: '#FFF',
    position: 'absolute',
    top: 9,
    right: 3,
    padding: 10,
  },
  codeInputDisabledContainer: {
    justifyContent: 'center',
    paddingHorizontal: 10,
    marginVertical: 5,
    borderColor: colors.inputBorder,
    borderRadius: 3,
    borderWidth: 1,
    height: 50,
    backgroundColor: '#F0F0F0',
  },
  codeValue: {
    ...fontStyles.body,
    fontSize: 15,
    color: colors.darkSecondary,
  },
  missingCodesLink: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 10,
    marginVertical: 20,
  },
  modalContainer: {
    backgroundColor: colors.background,
    padding: 20,
    marginHorizontal: 10,
    borderRadius: 4,
  },
  modalHeader: {
    ...fontStyles.h2,
    ...fontStyles.bold,
    marginVertical: 15,
  },
  modalTimerContainer: {
    alignItems: 'center',
  },
  modalButtonsContainer: {
    marginTop: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  modalCancelText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    paddingRight: 20,
  },
  modalSkipText: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    color: colors.celoGreen,
    paddingLeft: 20,
  },
  modalSkipTextDisabled: { color: colors.celoGreenInactive },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxVerification2)(VerificationInputScreen))
)
