import Button, { BtnTypes } from '@celo/react-components/components/Button'
import CopyIcon from '@celo/react-components/icons/Copy'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Clipboard, ScrollView, StyleSheet, Text, View } from 'react-native'
import KeepAwake from 'react-native-keep-awake'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CancelButton from 'src/components/CancelButton'
import DevSkipButton from 'src/components/DevSkipButton'
import { ERROR_BANNER_DURATION } from 'src/config'
import GethAwareButton from 'src/geth/GethAwareButton'
import NuxLogo from 'src/icons/NuxLogo'
import {
  cancelVerification,
  receiveAttestationMessage,
  startVerification,
} from 'src/identity/actions'
import {
  AttestationCode,
  CodeInputType,
  NUM_ATTESTATIONS_REQUIRED,
} from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import Logger from 'src/utils/Logger'
import ProgressIndicatorRow from 'src/verify/ProgressIndicator'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'verify/verifying'

function verificationCodeText(code: AttestationCode, isComplete: boolean) {
  const text = (code && code.code) || '---'
  return (
    <Text
      style={isComplete ? [style.textCode, style.textGreen] : style.textCode}
      numberOfLines={1}
      ellipsizeMode="tail"
    >
      {text}
    </Text>
  )
}

interface StateProps {
  numberVerified: boolean
  e164Number: string
  account: string | null
  codes: AttestationCode[]
  numCompleteAttestations: number
  verificationFailed: boolean
}

interface DispatchProps {
  startVerification: typeof startVerification
  cancelVerification: typeof cancelVerification
  receiveVerificationMessage: typeof receiveAttestationMessage
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  useManualEntry: boolean
}

const mapDispatchToProps = {
  startVerification,
  cancelVerification,
  receiveVerificationMessage: receiveAttestationMessage,
  showError,
  hideAlert,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    numberVerified: state.app.numberVerified,
    e164Number: state.account.e164PhoneNumber,
    codes: state.identity.attestationCodes,
    numCompleteAttestations: state.identity.numCompleteAttestations,
    verificationFailed: state.identity.verificationFailed,
    account: currentAccountSelector(state),
  }
}

export class Verifying extends React.Component<Props, State> {
  state = {
    useManualEntry: false,
  }

  componentDidMount() {
    this.startVerification()
  }

  componentDidUpdate() {
    if (this.isVerificationComplete()) {
      this.finishVerification()
    }
  }

  onEnterManually = () => {
    this.setState({
      useManualEntry: true,
    })
    CeloAnalytics.track(CustomEventNames.verification_manual_selected)
  }

  onPasteVerificationCode = async () => {
    try {
      this.props.hideAlert()
      const message = await Clipboard.getString()
      if (!message) {
        this.props.showError(ErrorMessages.EMPTY_VERIFICATION_CODE, ERROR_BANNER_DURATION)
        return
      }
      Logger.debug(TAG + '@onPasteVerificationCode', 'Submitting code manually')
      this.props.receiveVerificationMessage(message, CodeInputType.MANUAL)
    } catch (error) {
      Logger.error(TAG, 'Error during manual code input', error)
      this.props.showError(ErrorMessages.INVALID_ATTESTATION_CODE, ERROR_BANNER_DURATION)
    }
  }

  isVerificationComplete = () => {
    return this.props.numCompleteAttestations >= NUM_ATTESTATIONS_REQUIRED
  }

  startVerification = async () => {
    Logger.debug(TAG + '@startVerification', 'Starting verification process')
    this.props.startVerification()
  }

  finishVerification = () => {
    Logger.debug(TAG + '@finishVerification', 'Verification finished, navigating to next screen.')
    this.props.hideAlert()

    // Add short delay to show the checkmarks once ver. is done
    setTimeout(() => {
      navigate(Screens.VerifyVerified)
    }, 1000)
  }

  onCancelVerification = () => {
    this.props.cancelVerification()
    navigate(Screens.VerifyInput)
  }

  onRetryVerification = () => {
    Logger.debug(TAG + '@onRetryVerification', 'Restarting verification process')
    this.props.hideAlert()
    this.props.startVerification()
  }

  getStatusText = (confirmations: number, hasVerificationFailure: boolean) => {
    if (confirmations <= 0 && hasVerificationFailure) {
      return this.props.t('errorRequestCode')
    } else if (confirmations > 0 && hasVerificationFailure) {
      return this.props.t('errorRedeemingCode')
    } else if (confirmations === 0) {
      return this.props.t('startingVerification')
    } else if (confirmations < NUM_ATTESTATIONS_REQUIRED) {
      return this.props.t('nextCode')
    } else {
      return this.props.t('verificationComplete')
    }
  }

  render() {
    const { useManualEntry } = this.state
    const { codes, numCompleteAttestations, verificationFailed, e164Number, t } = this.props
    const numCodesReceived = codes.length

    return (
      <View style={style.container}>
        <KeepAwake />
        <DevSkipButton nextScreen={Screens.VerifyVerified} />
        {!verificationFailed && (
          <View style={style.buttonCancelContainer}>
            <CancelButton onCancel={this.onCancelVerification} />
          </View>
        )}
        <ScrollView style={style.content}>
          <DisconnectBanner />
          <NuxLogo testID="VerifyLogo" />
          <ProgressIndicatorRow step={numCompleteAttestations} hasFailure={verificationFailed} />
          <Text style={style.textPhoneNumber}>
            <Text style={style.textLight}>{t('verifying')}</Text>
            {e164Number}
          </Text>
          {verificationCodeText(codes[0], numCompleteAttestations > 0)}
          {verificationCodeText(codes[1], numCompleteAttestations > 1)}
          {verificationCodeText(codes[2], numCompleteAttestations > 2)}
          <Text
            style={[style.textStatus, verificationFailed ? style.textRed : null]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {this.getStatusText(numCompleteAttestations, verificationFailed)}
          </Text>
          {!verificationFailed && (
            <>
              <Text style={[fontStyles.body, fontStyles.center]}>{t('leaveOpen')}</Text>
              <Text style={[fontStyles.body, fontStyles.center]}>{t('thisWillTakeTime')}</Text>
            </>
          )}
          {verificationFailed && (
            <Text style={[fontStyles.body, fontStyles.center, style.textRed]}>
              {t('pleaseRetry')}
            </Text>
          )}
        </ScrollView>
        <View style={style.content}>
          {!verificationFailed && (
            <>
              {!useManualEntry && (
                <View>
                  <Text style={style.textDisclaimer}>
                    <Text style={fontStyles.bold}>{t('mustDoManualLabel')}</Text>
                    {t('mustDoManual')}
                  </Text>
                  <Button
                    onPress={this.onEnterManually}
                    text={t('enterManually')}
                    standard={true}
                    type={BtnTypes.SECONDARY}
                    style={style.buttonEnterManually}
                  />
                </View>
              )}
              {useManualEntry && (
                <View>
                  <Text style={style.textDisclaimer}>
                    <Text style={fontStyles.bold}>{t('copyPaste')}</Text>
                    {t('entireSmsMessage')}
                  </Text>
                  <GethAwareButton
                    onPress={this.onPasteVerificationCode}
                    disabled={numCodesReceived === NUM_ATTESTATIONS_REQUIRED}
                    text={t('pasteCode', {
                      codeNumber: Math.min(numCodesReceived + 1, NUM_ATTESTATIONS_REQUIRED),
                    })}
                    standard={true}
                    type={BtnTypes.PRIMARY}
                    style={componentStyles.marginTop15}
                  >
                    <CopyIcon />
                  </GethAwareButton>
                </View>
              )}
            </>
          )}
          {verificationFailed && (
            <Button
              onPress={this.onRetryVerification}
              text={t('retryVerification')}
              standard={true}
              type={BtnTypes.PRIMARY}
              style={componentStyles.marginTop15}
            />
          )}
        </View>
      </View>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  content: {
    width: '100%',
  },
  textGreen: {
    color: colors.celoGreen,
  },
  textRed: {
    color: colors.errorRed,
  },
  textLight: {
    ...fontStyles.light,
    fontWeight: '100',
    color: colors.darkSecondary,
  },
  textPhoneNumber: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    ...fontStyles.center,
    marginTop: 15,
    marginBottom: 20,
  },
  textCode: {
    ...fontStyles.bodySecondary,
    ...fontStyles.semiBold,
    ...fontStyles.center,
    marginTop: 10,
    paddingHorizontal: 10,
  },
  textStatus: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    ...fontStyles.center,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderColor: colors.sectionBorder,
  },
  textDisclaimer: {
    ...fontStyles.light,
    ...fontStyles.center,
    fontSize: 14,
    lineHeight: 20,
    color: colors.dark,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  buttonEnterManually: {
    marginVertical: 10,
  },
  buttonCancelContainer: {
    position: 'absolute',
    top: 5,
    left: 0,
    zIndex: 10,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces('nuxVerification2')(Verifying))
)
