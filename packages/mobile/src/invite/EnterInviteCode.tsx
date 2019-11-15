import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Clipboard, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import CodeRow, { CodeRowStatus } from 'src/components/CodeRow'
import DevSkipButton from 'src/components/DevSkipButton'
import { CELO_FAUCET_LINK, SHOW_GET_INVITE_LINK } from 'src/config'
import { Namespaces } from 'src/i18n'
import { denyImportContacts, setHasSeenVerificationNux } from 'src/identity/actions'
import { redeemInvite } from 'src/invite/actions'
import { extractValidInviteCode, getValidInviteCodeFromReferrerData } from 'src/invite/utils'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { navigateToURI } from 'src/utils/linking'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  redeemComplete: boolean
  isRedeemingInvite: boolean
  account: string | null
}

interface State {
  // appState: AppStateStatus
  inputValue: string
}

interface DispatchProps {
  redeemInvite: typeof redeemInvite
  showError: typeof showError
  hideAlert: typeof hideAlert
  // TODO(Rossy): Remove when import screen is removed
  denyImportContacts: typeof denyImportContacts
  setHasSeenVerificationNux: typeof setHasSeenVerificationNux
}

const mapDispatchToProps = {
  redeemInvite,
  showError,
  hideAlert,
  denyImportContacts,
  setHasSeenVerificationNux,
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    redeemComplete: state.invite.redeemComplete,
    isRedeemingInvite: state.invite.isRedeemingInvite,
    account: currentAccountSelector(state),
  }
}

type Props = StateProps & DispatchProps & WithNamespaces

export class EnterInviteCode extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptionsNoBackButton

  state: State = {
    // appState: AppState.currentState,
    inputValue: '',
  }

  async componentDidMount() {
    // AppState.addEventListener('change', this.handleAppStateChange)
    await this.checkIfValidCodeInClipboard()
    await this.checkForReferrerCode()
  }

  componentWillUnmount() {
    // AppState.removeEventListener('change', this.handleAppStateChange)
  }

  checkForReferrerCode = async () => {
    const validCode = await getValidInviteCodeFromReferrerData()
    if (validCode) {
      this.setState({ inputValue: validCode })
    }
  }

  checkIfValidCodeInClipboard = async () => {
    const message = await Clipboard.getString()
    const code = extractValidInviteCode(message)
    if (code) {
      this.onInputChange(code)
    }
  }

  // handleAppStateChange = async (nextAppState: AppStateStatus) => {
  //   if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
  //     await this.checkIfValidCodeInClipboard()
  //   }
  //   this.setState({ appState: nextAppState })
  // }

  // onPressOpenMessage = () => {
  //   if (Platform.OS === 'android') {
  //     SendIntentAndroid.openSMSApp()
  //   } else {
  //     navigateToURI('sms:')
  //   }
  // }

  // onPressPaste = async () => {
  //   this.props.hideAlert()
  //   const { inputValue: validCode } = this.state

  //   Logger.debug('Extracted invite code:', validCode || '')

  //   if (!validCode) {
  //     this.props.showError(ErrorMessages.INVALID_INVITATION)
  //     return
  //   }

  //   this.props.redeemInvite(validCode)
  // }

  onPressImportClick = async () => {
    navigate(Screens.ImportWallet)
  }

  onPressContinue = () => {
    navigate(Screens.ImportContacts)
  }

  onPressGoToFaucet = () => {
    navigateToURI(CELO_FAUCET_LINK)
  }

  onPressSkip = () => {
    //TODO create account
    this.props.denyImportContacts()
    this.props.setHasSeenVerificationNux(true)
    navigateHome()
  }

  onInputChange = (value: string) => {
    this.setState({ inputValue: value })
    if (extractValidInviteCode(value)) {
      this.props.redeemInvite(value)
    }
  }

  shouldShowClipboard = (value: string) => {
    return !!extractValidInviteCode(value)
  }

  render() {
    const { t, isRedeemingInvite, redeemComplete, account } = this.props
    const { inputValue } = this.state

    let codeStatus = CodeRowStatus.INPUTTING
    if (isRedeemingInvite) {
      codeStatus = CodeRowStatus.PROCESSING
    } else if (redeemComplete) {
      codeStatus = CodeRowStatus.ACCEPTED
    }

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps={'always'}
        >
          <DevSkipButton nextScreen={Screens.ImportContacts} />
          <Text style={styles.h1} testID={'InviteCodeTitle'}>
            {t('inviteCodeText.title')}
          </Text>
          <Text style={fontStyles.body}>{t('inviteCodeText.body')}</Text>
          <Text style={styles.codeHeader}>{t('inviteCodeText.codeHeader')}</Text>
          <CodeRow
            status={codeStatus}
            inputValue={inputValue || t('global:accepted')}
            inputPlaceholder={'Celo code: am9hBM3tiA+CuNb...'}
            onInputChange={this.onInputChange}
            shouldShowClipboard={this.shouldShowClipboard}
          />

          {/* <View style={styles.inviteActionContainer}>
            {!redeemComplete && (
              <Text style={styles.body}>
                <Text>{t('inviteCodeText.copyInvite.0')}</Text>
                {t('inviteCodeText.copyInvite.1')}
              </Text>
            )}

            {redeemComplete ? (
              <Text style={[styles.body, componentStyles.marginTop10]}>
                {t('inviteCodeText.inviteAccepted')}
              </Text>
            ) : (
              !isRedeemingInvite &&
              (!validCode ? (
                <View>
                  <Text style={styles.hint}>
                    <Text style={fontStyles.bodySmallSemiBold}>
                      {t('inviteCodeText.openMessages.hint.0')}
                    </Text>
                    {t('inviteCodeText.openMessages.hint.1')}
                  </Text>
                  <SmallButton
                    text={t('inviteCodeText.openMessages.message')}
                    testID={'openMessageButton'}
                    onPress={this.onPressOpenMessage}
                    solid={true}
                    style={styles.button}
                  />
                </View>
              ) : (
                <View>
                  <Text style={styles.hint}>{t('inviteCodeText.pasteInviteCode.hint')}</Text>
                  <SmallButton
                    text={t('inviteCodeText.pasteInviteCode.message')}
                    testID={'pasteMessageButton'}
                    onPress={this.onPressPaste}
                    solid={false}
                    style={styles.button}
                  />
                </View>
              ))
            )}
            {isRedeemingInvite &&
              !redeemComplete && (
                <View>
                  <Text style={styles.hint}>{t('inviteCodeText.validating')}</Text>
                  <ActivityIndicator
                    size="large"
                    color={colors.celoGreen}
                    style={componentStyles.marginTop10}
                  />
                </View>
              )}
          </View> */}
        </KeyboardAwareScrollView>

        <View>
          <Text style={styles.askInviteText}>
            <Text style={fontStyles.bodySmallBold}>{t('inviteCodeText.noCode')}</Text>
            {SHOW_GET_INVITE_LINK ? (
              <>
                {t('inviteCodeText.requestCodeFromFaucet')}
                <Text onPress={this.onPressGoToFaucet} style={styles.askInviteLink}>
                  {t('inviteCodeText.faucetLink')}
                </Text>
                {' ' + t('global:or') + ' '}
                <Text onPress={this.onPressSkip} style={styles.askInviteLink}>
                  {t('inviteCodeText.skip')}
                </Text>
              </>
            ) : (
              <>
                {t('inviteCodeText.requestCodeNoFaucet')}
                <Text onPress={this.onPressSkip} style={styles.askInviteLink}>
                  {t('inviteCodeText.skip')}
                </Text>
              </>
            )}
          </Text>
          <Button
            onPress={this.onPressContinue}
            disabled={isRedeemingInvite || !redeemComplete || !account}
            text={t('continue')}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="ContinueInviteButton"
          />
          <Button
            onPress={this.onPressImportClick}
            disabled={isRedeemingInvite || !!account}
            text={t('importIt')}
            standard={false}
            type={BtnTypes.SECONDARY}
            testID="ContinueInviteButton"
          />
        </View>
        <KeyboardSpacer />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  codeHeader: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    marginTop: 20,
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
  },
  askInviteText: {
    ...fontStyles.bodySmall,
    marginVertical: 20,
    marginHorizontal: 20,
  },
  askInviteLink: {
    ...fontStyles.bodySmall,
    textDecorationLine: 'underline',
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(EnterInviteCode))
)
