import Button, { BtnTypes } from '@celo/react-components/components/Button'
import SmallButton from '@celo/react-components/components/SmallButton'
import InviteCodeIcon from '@celo/react-components/icons/InviteCodeIcon'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Clipboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { CELO_FAUCET_LINK } from 'src/config'
import { Namespaces } from 'src/i18n'
import { redeemInvite } from 'src/invite/actions'
import { extractValidInviteCode, getInviteCodeFromReferrerData } from 'src/invite/utils'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  redeemComplete: boolean
  isRedeemingInvite: boolean
  account: string | null
}

interface State {
  appState: AppStateStatus
  validCode: string | null
}

interface DispatchProps {
  redeemInvite: typeof redeemInvite
  showError: typeof showError
  hideAlert: typeof hideAlert
}

const mapDispatchToProps = {
  redeemInvite,
  showError,
  hideAlert,
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
    appState: AppState.currentState,
    validCode: null,
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange)
    this.checkForReferrerCode()
    this.checkIfValidCodeInClipboard()
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange)
  }

  checkForReferrerCode = async () => {
    const validCode = await getInviteCodeFromReferrerData()
    if (validCode) {
      this.setState({ validCode })
    }
  }

  checkIfValidCodeInClipboard = async () => {
    const message = await Clipboard.getString()
    const validCode = extractValidInviteCode(message)
    if (validCode) {
      this.setState({ validCode })
    }
  }

  handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      this.checkIfValidCodeInClipboard()
    }
    this.setState({ appState: nextAppState })
  }

  onPressOpenMessage = () => {
    if (Platform.OS === 'android') {
      SendIntentAndroid.openSMSApp()
    } else {
      navigateToURI('sms:')
    }
  }

  onPressPaste = async () => {
    this.props.hideAlert()
    const { validCode } = this.state

    Logger.debug('Extracted invite code:', validCode || '')

    if (!validCode) {
      this.props.showError(ErrorMessages.INVALID_INVITATION)
      return
    }

    this.props.redeemInvite(validCode)
  }

  onPressImportClick = async () => {
    navigate(Screens.ImportWallet)
  }

  onPressContinue = () => {
    navigate(Screens.ImportContacts)
  }

  onPressGoToFaucet = () => {
    navigateToURI(CELO_FAUCET_LINK)
  }

  render() {
    const { t, isRedeemingInvite, redeemComplete, account } = this.props
    const { validCode } = this.state

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DevSkipButton nextScreen={Screens.ImportContacts} />
          <InviteCodeIcon />
          <Text style={styles.h1} testID={'InviteCodeTitle'}>
            {t('inviteCodeText.title')}
          </Text>
          <View style={styles.inviteActionContainer}>
            <Text style={styles.body}>
              <Text>{t('inviteCodeText.copyInvite.0')}</Text>
              {t('inviteCodeText.copyInvite.1')}
            </Text>

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
          </View>
        </ScrollView>

        <View>
          <Text style={[styles.body, styles.askInviteContainer]}>
            {t('inviteCodeText.askForInvite.0')}
            <Text onPress={this.onPressGoToFaucet} style={styles.askInvite}>
              {t('inviteCodeText.askForInvite.1')}
            </Text>
          </Text>
          <Button
            onPress={this.onPressContinue}
            disabled={!redeemComplete && !account}
            text={t('continue')}
            standard={false}
            style={styles.continueButton}
            type={BtnTypes.PRIMARY}
            testID="ContinueInviteButton"
          />
          <Button
            onPress={this.onPressImportClick}
            disabled={redeemComplete || !!account}
            text={t('importIt')}
            standard={false}
            style={styles.continueButton}
            type={BtnTypes.SECONDARY}
            testID="ContinueInviteButton"
          />
        </View>
      </View>
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteActionContainer: {
    ...componentStyles.roundedBorder,
    padding: 30,
    marginVertical: 30,
    marginHorizontal: 20,
  },
  h1: {
    ...fontStyles.h1,
    marginTop: 20,
  },
  body: {
    ...fontStyles.bodySmall,
    textAlign: 'center',
    alignSelf: 'center',
  },
  askInviteContainer: {
    marginVertical: 10,
    marginHorizontal: 20,
  },
  askInvite: {
    ...fontStyles.bodySmallBold,
    ...fontStyles.linkInline,
    fontSize: 12,
    fontWeight: '300',
  },
  hint: {
    ...fontStyles.bodyXSmall,
    textAlign: 'center',
    marginVertical: 10,
  },
  button: {
    marginTop: 6,
    alignSelf: 'center',
    fontSize: 14,
  },
  continueButton: {
    width: '100%',
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(EnterInviteCode))
)
