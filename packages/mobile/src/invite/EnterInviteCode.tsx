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
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import SendIntentAndroid from 'react-native-send-intent'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { Namespaces } from 'src/i18n'
import { redeemInvite } from 'src/invite/actions'
import { extractValidInviteCode, getInviteCodeFromReferrerData } from 'src/invite/utils'
import { nuxNavigationOptionsNoBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

function goToFaucet() {
  Linking.openURL('https://celo.org/build/wallet')
}

interface StateProps {
  error: ErrorMessages | null
  name: string
  redeemComplete: boolean
}

interface State {
  isSubmitting: boolean
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
    error: errorSelector(state),
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
  static navigationOptions = nuxNavigationOptionsNoBackButton

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
    isSubmitting: false,
    appState: AppState.currentState,
    validCode: null,
  }

  async componentDidMount() {
    AppState.addEventListener('change', this.handleAppStateChange)
    this.checkForReferrerCode()
    this.checkIfValidCodeInClipboard()
  }

  componentWillUnmount() {
    AppState.removeEventListener('change', this.handleAppStateChange)
  }

  openMessage = () => {
    SendIntentAndroid.openSMSApp()
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

  onPaste = async () => {
    this.setState({ isSubmitting: true })
    try {
      this.props.hideAlert()
      const { validCode } = this.state

      Logger.debug('Extracted invite code:', validCode || '')

      if (!validCode) {
        this.props.showError(ErrorMessages.INVALID_INVITATION)
        return
      }
      this.props.redeemInvite(validCode, this.props.name)
    } catch {
      this.setState({ isSubmitting: false })
      this.props.showError(ErrorMessages.REDEEM_INVITE_FAILED)
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
          <InviteCodeIcon />
          <Text style={[fontStyles.h1, styles.h1]} testID={'InviteCodeTitle'}>
            {t('inviteCodeText.title')}
          </Text>
          <View style={[componentStyles.roundedBorder, styles.inviteActionContainer]}>
            <Text style={styles.body}>
              <Text>{t('inviteCodeText.copyInvite.0')}</Text>
              {t('inviteCodeText.copyInvite.1')}
            </Text>

            {this.props.redeemComplete ? (
              <Text
                style={[fontStyles.bodySmallBold, fontStyles.center, componentStyles.marginTop10]}
              >
                {t('inviteCodeText.inviteAccepted')}
              </Text>
            ) : (
              !this.state.isSubmitting &&
              (!this.state.validCode ? (
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
                  <ActivityIndicator
                    size="large"
                    color={colors.celoGreen}
                    style={styles.activity}
                  />
                </View>
              )}
          </View>
        </ScrollView>

        <View>
          <Text style={[styles.body, styles.askInviteContainer]}>
            {t('inviteCodeText.askForInvite.0')}
            <Text
              onPress={goToFaucet}
              style={[fontStyles.bodySmallBold, fontStyles.linkInline, styles.askInvite]}
            >
              {t('inviteCodeText.askForInvite.1')}
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
          <Button
            onPress={this.onImportClick}
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
    padding: 30,
    marginVertical: 30,
    marginHorizontal: 20,
  },
  h1: {
    marginTop: 20,
  },
  body: {
    ...fontStyles.bodySmall,
    color: colors.dark,
    textAlign: 'center',
    alignSelf: 'center',
  },
  askInviteContainer: {
    marginVertical: 10,
    marginHorizontal: 20,
  },
  askInvite: {
    fontSize: 12,
    fontWeight: '300',
  },
  activity: {
    marginTop: 10,
  },
  hint: {
    marginVertical: 10,
    fontSize: 12,
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
