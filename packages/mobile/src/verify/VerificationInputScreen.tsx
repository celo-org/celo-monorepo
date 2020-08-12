import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { Spacing } from '@celo/react-components/styles/styles.v2'
import { extractAttestationCodeFromMessage } from '@celo/utils/src/attestations'
import { HeaderHeightContext, StackScreenProps } from '@react-navigation/stack'
import dotProp from 'dot-prop-immutable'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { LayoutAnimation, Platform, StyleSheet, Text, View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { connect, useDispatch } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackButton from 'src/components/BackButton.v2'
import DevSkipButton from 'src/components/DevSkipButton'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { cancelVerification, receiveAttestationMessage } from 'src/identity/actions'
import { VerificationStatus } from 'src/identity/types'
import {
  AttestationCode,
  CodeInputType,
  NUM_ATTESTATIONS_REQUIRED,
} from 'src/identity/verification'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers.v2'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import TopBarTextButtonOnboarding from 'src/onboarding/TopBarTextButtonOnboarding'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'
import VerificationCodeInput from 'src/verify/VerificationCodeInput'
import VerificationInputHelpDialog from 'src/verify/VerificationInputHelpDialog'

const TAG = 'VerificationInputScreen'

type ScreenProps = StackScreenProps<StackParamList, Screens.VerificationInputScreen>

interface StateProps {
  e164Number: string | null
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

type Props = StateProps & DispatchProps & WithTranslation & ScreenProps

interface State {
  timer: number
  codeInputValues: string[]
  codeSubmittingStatuses: boolean[]
  isTipVisible: boolean
  isKeyboardVisible: boolean
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

function HeaderLeftButton() {
  const dispatch = useDispatch()
  const onCancel = () => {
    Logger.debug(TAG + '@onCancel', 'Cancelled, going back to education screen')
    dispatch(cancelVerification())
    navigate(Screens.VerificationEducationScreen)
  }

  return <BackButton onPress={onCancel} />
}

class VerificationInputScreen extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: ScreenProps) => ({
    ...nuxNavigationOptions,
    gestureEnabled: false,
    headerLeft: () => {
      return <HeaderLeftButton />
    },
    headerTitle: () => (
      <HeaderTitleWithSubtitle
        title={i18n.t('onboarding:verificationInput.title')}
        subTitle={i18n.t('onboarding:step', { step: '4' })}
      />
    ),
    headerRight: () => (
      <TopBarTextButtonOnboarding
        title={i18n.t('global:help')}
        testID="VerificationInputHelp"
        // tslint:disable-next-line: jsx-no-lambda
        onPress={() => navigation.setParams({ showHelpDialog: true })}
      />
    ),
  })

  tipHideTimer?: number
  interval?: number

  state: State = {
    timer: 60,
    codeInputValues: ['', '', ''],
    codeSubmittingStatuses: [false, false, false],
    isTipVisible: false,
    isKeyboardVisible: false,
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

  componentDidUpdate(prevProps: Props) {
    if (this.isVerificationComplete(prevProps)) {
      return this.finishVerification()
    }
    if (this.isCodeRejected() && this.isAnyCodeSubmitting()) {
      this.setState({ codeSubmittingStatuses: [false, false, false] })
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval)
    clearTimeout(this.tipHideTimer)
  }

  isVerificationComplete = (prevProps: Props) => {
    return (
      prevProps.numCompleteAttestations < NUM_ATTESTATIONS_REQUIRED &&
      this.props.numCompleteAttestations >= NUM_ATTESTATIONS_REQUIRED
    )
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
    navigate(Screens.ImportContacts)
  }

  onChangeInputCode = (index: number) => {
    return (value: string) => {
      // TODO(Rossy) Add test this of typing codes gradually
      this.setState((state) => dotProp.set(state, `codeInputValues.${index}`, value))
      if (extractAttestationCodeFromMessage(value)) {
        this.setState((state) => dotProp.set(state, `codeSubmittingStatuses.${index}`, true))
        this.props.receiveAttestationMessage(value, CodeInputType.MANUAL)
      }
    }
  }

  onKeyboardToggle = (visible: boolean) => {
    clearTimeout(this.tipHideTimer)
    this.setState({ isKeyboardVisible: visible, isTipVisible: visible })
    if (visible) {
      this.tipHideTimer = window.setTimeout(() => {
        LayoutAnimation.easeInEaseOut()
        this.setState({ isTipVisible: false })
      }, 3000)
    }
  }

  onPressCodesNotReceived = () => {
    this.props.navigation.setParams({ showHelpDialog: true })
  }

  onPressWaitForCodes = () => {
    this.props.navigation.setParams({ showHelpDialog: false })
  }

  onPressSkip = () => {
    this.props.cancelVerification()
    navigateHome()
  }

  render() {
    const {
      codeInputValues,
      codeSubmittingStatuses,
      isTipVisible,
      isKeyboardVisible,
      timer,
    } = this.state
    const { t, attestationCodes, numCompleteAttestations, route } = this.props
    const showHelpDialog = route.params?.showHelpDialog || false
    const translationPlatformContext = Platform.select({ ios: 'ios' })

    return (
      <HeaderHeightContext.Consumer>
        {(headerHeight) => (
          <SafeAreaInsetsContext.Consumer>
            {(insets) => (
              <View style={styles.container}>
                <View style={styles.innerContainer}>
                  <KeyboardAwareScrollView
                    style={headerHeight ? { marginTop: headerHeight } : undefined}
                    contentContainerStyle={[
                      styles.scrollContainer,
                      !isKeyboardVisible && insets && { marginBottom: insets.bottom },
                    ]}
                    keyboardShouldPersistTaps={'always'}
                  >
                    <DevSkipButton nextScreen={Screens.WalletHome} />
                    <Text style={styles.body}>
                      {t('verificationInput.body', { context: translationPlatformContext })}
                    </Text>
                    {[0, 1, 2].map((i) => (
                      <View key={'verificationCodeRow' + i}>
                        <VerificationCodeInput
                          label={t('verificationInput.codeLabel' + (i + 1))}
                          index={i}
                          inputValue={codeInputValues[i]}
                          inputPlaceholder={t('verificationInput.codePlaceholder' + (i + 1), {
                            context: translationPlatformContext,
                          })}
                          inputPlaceholderWithClipboardContent={t(
                            'verificationInput.codePlaceholderWithCodeInClipboard'
                          )}
                          isCodeSubmitting={codeSubmittingStatuses[i]}
                          onInputChange={this.onChangeInputCode(i)}
                          attestationCodes={attestationCodes}
                          numCompleteAttestations={numCompleteAttestations}
                          style={styles.codeInput}
                        />
                      </View>
                    ))}
                  </KeyboardAwareScrollView>
                  <View style={styles.tipContainer} pointerEvents="none">
                    <View
                      key={isTipVisible ? 'tip' : undefined}
                      style={[styles.tip, isTipVisible && { opacity: 1.0 }]}
                    >
                      <Text style={styles.tipText}>{t('verificationInput.typingTip')}</Text>
                    </View>
                  </View>
                </View>
                <VerificationInputHelpDialog
                  isVisible={showHelpDialog}
                  secondsLeft={timer}
                  onPressBack={this.onPressWaitForCodes}
                  onPressSkip={this.onPressSkip}
                />
                <KeyboardSpacer onToggle={this.onKeyboardToggle} />
              </View>
            )}
          </SafeAreaInsetsContext.Consumer>
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    backgroundColor: colors.onboardingBackground,
  },
  innerContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: Spacing.Regular16,
    paddingTop: 32,
  },
  body: {
    ...fontStyles.regular,
    marginBottom: Spacing.Thick24,
  },
  codeInput: {
    marginBottom: Spacing.Thick24,
  },
  tipContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
  },
  tip: {
    opacity: 0,
    backgroundColor: colors.onboardingBlue,
    borderRadius: 4,
    marginHorizontal: Spacing.Regular16,
    marginVertical: Spacing.Regular16,
  },
  tipText: {
    ...fontStyles.small500,
    textAlign: 'center',
    color: colors.light,
    paddingVertical: Spacing.Smallest8,
    paddingHorizontal: Spacing.Regular16,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.onboarding)(VerificationInputScreen))
