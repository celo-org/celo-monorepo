import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import Link from '@celo/react-components/components/Link'
import TextButton from '@celo/react-components/components/TextButton'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { extractAttestationCodeFromMessage } from '@celo/utils/src/attestations'
import dotProp from 'dot-prop-immutable'
import { padStart } from 'lodash'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { EmitterSubscription, StyleSheet, Text, View } from 'react-native'
import Modal from 'react-native-modal'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CancelButton from 'src/components/CancelButton'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces, withTranslation } from 'src/i18n'
import LoadingSpinner from 'src/icons/LoadingSpinner'
import { cancelVerification, receiveAttestationMessage } from 'src/identity/actions'
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
import VerificationCodeRow from 'src/verify/VerificationCodeRow'

const TAG = 'VerificationInputScreen'

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

type Props = StateProps & DispatchProps & WithTranslation

interface State {
  timer: number
  codeInputValues: string[]
  codeSubmittingStatuses: boolean[]
  isModalVisible: boolean
  isTipVisible: boolean
  didFinish: boolean
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

  interval?: number
  keyboardDidShowListener?: EmitterSubscription
  keyboardDidHideListener?: EmitterSubscription

  state: State = {
    timer: 60,
    codeInputValues: [],
    codeSubmittingStatuses: [],
    isModalVisible: false,
    isTipVisible: false,
    didFinish: false,
  }

  componentDidMount() {
    this.interval = window.setInterval(() => {
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
    return this.props.numCompleteAttestations >= NUM_ATTESTATIONS_REQUIRED && !this.state.didFinish
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
    this.setState({ didFinish: true })
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

  onKeyboardToggle = (visible: boolean) => {
    this.setState({ isTipVisible: visible })
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
    const {
      codeInputValues,
      codeSubmittingStatuses,
      isModalVisible,
      isTipVisible,
      timer,
    } = this.state
    const { t, attestationCodes, numCompleteAttestations } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.buttonCancelContainer}>
          <CancelButton onCancel={this.onCancel} />
        </View>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <DevSkipButton nextScreen={Screens.WalletHome} />
          <View style={styles.timerContainer}>
            <LoadingSpinner />
            {timer > 0 ? (
              <Text style={styles.timerText}>{'0:' + padStart(`${timer}`, 2, '0')}</Text>
            ) : (
              <Text style={styles.timerText}>{t('input.sendingCodes')}</Text>
            )}
          </View>
          <Text style={fontStyles.h1} testID="VerificationInputHeader">
            {t('input.header')}
          </Text>
          <Text style={fontStyles.body}>
            <Text style={fontStyles.bold}>{t('input.body1')}</Text>
            {t('input.body2')}
          </Text>
          {[0, 1, 2].map((i) => (
            <View key={'verificationCodeRow' + i}>
              <Text style={styles.codeHeader}>{t('input.codeHeader' + (i + 1))}</Text>
              <VerificationCodeRow
                index={i}
                inputValue={codeInputValues[i]}
                isCodeSubmitting={codeSubmittingStatuses[i]}
                onInputChange={this.onChangeInputCode(i)}
                attestationCodes={attestationCodes}
                numCompleteAttestations={numCompleteAttestations}
              />
            </View>
          ))}
          <Link style={styles.missingCodesLink} onPress={this.onPressCodesNotReceived}>
            {t('input.codesMissing')}
          </Link>
        </KeyboardAwareScrollView>
        {isTipVisible && (
          <View style={styles.tipContainer}>
            <Text style={fontStyles.bodySmall}>
              <Text style={fontStyles.bodySmallSemiBold} testID="noTypeTip">
                {t('global:Tip') + ': '}
              </Text>
              {t('input.tip')}
            </Text>
          </View>
        )}
        <Modal isVisible={isModalVisible}>
          <View style={styles.modalContainer}>
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
        <KeyboardSpacer onToggle={this.onKeyboardToggle} />
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
    padding: 30,
    paddingTop: 0,
  },
  buttonCancelContainer: {
    left: 5,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  timerText: {
    ...fontStyles.body,
    marginTop: 5,
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
  missingCodesLink: {
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 10,
    marginVertical: 20,
  },
  tipContainer: {
    backgroundColor: colors.backgroundDarker,
    paddingHorizontal: 30,
    paddingVertical: 15,
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
  )(withTranslation(Namespaces.nuxVerification2)(VerificationInputScreen))
)
