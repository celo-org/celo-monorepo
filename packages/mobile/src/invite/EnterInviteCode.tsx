import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import SmallButton from '@celo/react-components/components/SmallButton'
import InviteCodeIcon from '@celo/react-components/icons/InviteCodeIcon'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import {
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Clipboard,
  Linking,
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
import { ERROR_BANNER_DURATION } from 'src/config'
import { Namespaces } from 'src/i18n'
import { redeemInvite } from 'src/invite/actions'
import { extractValidInviteCode } from 'src/invite/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import Logger from 'src/utils/Logger'

function goToFaucet() {
  Linking.openURL('https://celo.org/dev/faucet')
}

interface StateProps {
  error: ErrorMessages | null
  name: string
  redeemComplete: boolean
}

interface State {
  inviteCode: string
  isSubmitting: boolean
  messageAppOpened: boolean
  appState: AppStateStatus
  validCodeInClipboard: boolean
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
    error: (state.alert && state.alert.underlyingError) || null,
    name: state.account.name,
    redeemComplete: state.invite.redeemComplete,
  }
}

type Props = StateProps & DispatchProps & WithNamespaces

const displayedErrors = [ErrorMessages.INVALID_INVITATION, ErrorMessages.REDEEM_INVITE_FAILED]

const hasDisplayedError = (error: ErrorMessages | null) => {
  return error && displayedErrors.includes(error)
}
export class EnterInviteCode extends React.Component<Props, State> {
  static navigationOptions = {
    headerStyle: {
      elevation: 0,
    },
    headerLeft: null,
    headerRightContainerStyle: { paddingRight: 15 },
    headerRight: (
      <View>
        <DisconnectBanner />
      </View>
    ),
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (hasDisplayedError(props.error) && state.isSubmitting) {
      return {
        ...state,
        isSubmitting: false,
      }
    }
    return null
  }

  state: State = {
    inviteCode: '',
    isSubmitting: false,
    messageAppOpened: false,
    appState: AppState.currentState,
    validCodeInClipboard: false,
  }

  componentDidMount() {
    AppState.addEventListener('change', this.handleValidCodeInClipboard)
  }

  componentWillUnmount() {
    AppState.addEventListener('change', this.handleValidCodeInClipboard)
  }

  openMessage = () => {
    this.setState({
      messageAppOpened: true,
    })
    SendIntentAndroid.openSMSApp()
  }

  handleValidCodeInClipboard = async (nextAppState: AppStateStatus) => {
    if (this.state.appState.match(/inactive|background/) && nextAppState === 'active') {
      const message = await Clipboard.getString()
      const validCode = extractValidInviteCode(message)

      this.setState({ validCodeInClipboard: validCode !== null })
    }
    this.setState({ appState: nextAppState })
  }

  onPaste = async () => {
    this.setState({ isSubmitting: true })
    try {
      this.props.hideAlert()
      const message = await Clipboard.getString()
      const validCode = extractValidInviteCode(message)

      Logger.debug('Extracted invite code:', validCode || '')

      if (!validCode) {
        this.props.showError(ErrorMessages.INVALID_INVITATION, ERROR_BANNER_DURATION)
        return
      }
      this.props.redeemInvite(validCode, this.props.name)
    } catch {
      this.setState({ isSubmitting: false })
      this.props.showError(ErrorMessages.REDEEM_INVITE_FAILED, ERROR_BANNER_DURATION)
    }
  }

  onImportClick = async () => {
    navigate(Screens.ImportWallet)
  }

  onContinue = () => {
    navigate(Screens.ImportContacts)
  }

  render() {
    const { t } = this.props

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <DevSkipButton nextScreen={Screens.ImportContacts} />
          <Text style={[fontStyles.h1, styles.h1]} testID={'InviteCodeTitle'}>
            {t('inviteCodeText.title')}
          </Text>
          <View style={styles.image}>
            <InviteCodeIcon />
          </View>
          <Text style={[styles.body, styles.copyInvite]}>
            <Text style={[fontStyles.bodySmallBold]}>{t('inviteCodeText.copyInvite.0')}</Text>
            {t('inviteCodeText.copyInvite.1')}
          </Text>

          <View style={styles.lineDivider} />
          {this.props.redeemComplete ? (
            <Text style={fontStyles.bodySmallBold}>{t('inviteCodeText.inviteAccepted')}</Text>
          ) : (
            !this.state.isSubmitting &&
            (!(this.state.messageAppOpened && this.state.validCodeInClipboard) ? (
              <View>
                <Text style={[styles.body, styles.hint]}>
                  <Text style={fontStyles.bodySmallSemiBold}>
                    {t('inviteCodeText.openMessages.hint.0')}
                  </Text>
                  {t('inviteCodeText.openMessages.hint.1')}
                </Text>
                <SmallButton
                  text={t('inviteCodeText.openMessages.message')}
                  testID={'openMessageButton'}
                  onPress={this.openMessage}
                  solid={true}
                  style={styles.button}
                />
              </View>
            ) : (
              <View>
                <Text style={[styles.body, styles.hint]}>
                  {t('inviteCodeText.pasteInviteCode.hint')}
                </Text>
                <SmallButton
                  text={t('inviteCodeText.pasteInviteCode.message')}
                  testID={'pasteMessageButton'}
                  onPress={this.onPaste}
                  solid={false}
                  style={styles.button}
                />
              </View>
            ))
          )}
          {this.state.isSubmitting &&
            !this.props.redeemComplete && (
              <View>
                <Text style={[styles.body, styles.hint]}>
                  <Text style={fontStyles.bodySmallSemiBold}>
                    {t('inviteCodeText.validating.0')}
                  </Text>
                  {t('inviteCodeText.validating.1')}
                </Text>
                <ActivityIndicator size="large" color={colors.celoGreen} style={styles.activity} />
              </View>
            )}
        </ScrollView>

        <View>
          <Text style={[styles.body, styles.askInvite]}>
            <Text style={[fontStyles.bodySmallBold, styles.askInvite]}>
              {t('inviteCodeText.askForInvite.0')}
            </Text>
            {t('inviteCodeText.askForInvite.1')}
            <Text
              onPress={goToFaucet}
              style={[fontStyles.bodySmallBold, fontStyles.linkInline, styles.askInvite]}
            >
              {t('inviteCodeText.askForInvite.2')}
            </Text>
          </Text>
          <Button
            onPress={this.onContinue}
            text={t('continue')}
            standard={false}
            style={styles.continueButton}
            type={BtnTypes.PRIMARY}
            disabled={!this.props.redeemComplete}
            testID="ContinueInviteButton"
          />
          <View style={styles.importWallet}>
            <Text style={[fontStyles.bodySmall, styles.body, styles.importWalletText]}>
              {t('haveWallet')}
            </Text>
            <Link
              style={[fontStyles.linkInline, styles.importWalletText]}
              onPress={this.onImportClick}
              disabled={this.state.isSubmitting}
              testID="ImportExistingUsingBackupKey"
            >
              {t('importIt')}
            </Link>
          </View>
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
    marginHorizontal: 10,
    alignItems: 'center',
  },
  h1: {
    color: colors.dark,
    paddingBottom: 63,
  },
  body: {
    ...fontStyles.bodySmall,
    color: colors.dark,
    textAlign: 'center',
    alignSelf: 'center',
  },
  copyInvite: {
    width: 208,
  },
  lineDivider: {
    width: '80%',
    borderTopWidth: 1,
    borderColor: colors.inactive,
    marginBottom: 26,
    marginTop: 21,
  },
  askInvite: {
    fontSize: 12,
    fontWeight: '300',
    width: 320,
    marginBottom: 6,
  },
  activity: {
    marginTop: 10,
  },
  hint: {
    fontSize: 12,
    width: 320,
    height: 20,
  },
  button: {
    marginTop: 6,
    alignSelf: 'center',
    fontSize: 14,
  },
  image: {
    marginBottom: 20,
  },
  continueButton: {
    width: '100%',
  },
  importWallet: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 17,
  },
  importWalletText: {
    fontSize: 13,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    mapDispatchToProps
  )(withNamespaces(Namespaces.nuxNamePin1)(EnterInviteCode))
)
