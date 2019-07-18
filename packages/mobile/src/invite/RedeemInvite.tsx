import { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import TextInput from '@celo/react-components/components/TextInput'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import URLSearchParamsReal from '@ungap/url-search-params'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from 'react-native'
import RNAndroidBroadcastReceiverForReferrer from 'react-native-android-broadcast-receiver-for-referrer'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import DevSkipButton from 'src/components/DevSkipButton'
import { ERROR_BANNER_DURATION } from 'src/config'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { redeemInvite } from 'src/invite/actions'
import { extractValidInviteCode } from 'src/invite/utils'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import Logger from 'src/utils/Logger'

function goToCeloSite() {
  Linking.openURL('https://celo.org/terms')
}

function goToWalletLandingPage() {
  Linking.openURL('https://celo.org/build/wallet')
}

interface StateProps {
  error: ErrorMessages | null
}
interface DispatchProps {
  redeemInvite: typeof redeemInvite
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  inviteCode: string
  name: string
  isSubmitting: boolean
}

const mapStateToProps = (state: RootState): StateProps => {
  const { alert } = state
  return {
    error: (alert && alert.underlyingError) || null,
  }
}

const displayedErrors = [ErrorMessages.REDEEM_INVITE_FAILED, ErrorMessages.INVALID_INVITATION]

const hasDisplayedError = (error: ErrorMessages | null) => {
  return error && displayedErrors.includes(error)
}

export const extractInviteCodeFromReferrerData = (referrerData: string) => {
  if (referrerData !== null && referrerData !== 'NOT AVAILABLE') {
    const params = new URLSearchParamsReal(decodeURIComponent(referrerData))
    const inviteCode = params.get('invite-code')
    if (inviteCode) {
      return inviteCode.replace(' ', '+')
    }
  }
  return null
}
export class RedeemInvite extends React.Component<Props, State> {
  static navigationOptions = {
    header: null,
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

  codeInput: any = React.createRef<RNTextInput>()
  scrollView = React.createRef<ScrollView>()

  state: State = {
    inviteCode: '',
    name: '',
    isSubmitting: false,
  }

  componentDidMount() {
    this.prefillInviteCode()
  }

  back = () => {
    navigateBack()
  }

  prefillInviteCode = async () => {
    // Try to fetch the invite code via the referrer param in the play store link. You can use the
    // following command to test sending the referrer intent on the dev version of the app:
    // yarn send-debug-invite-code
    try {
      const referrerData: string = await RNAndroidBroadcastReceiverForReferrer.getReferrerData()
      Logger.info('invite/RedeemInvite/prefillInviteCode', 'Referrer Data: ' + referrerData)
      const inviteCode = extractInviteCodeFromReferrerData(referrerData)
      if (inviteCode) {
        this.setState({ inviteCode })
      }
    } catch (error) {
      Logger.info('invite/RedeemInvite/prefillInviteCode', 'Unknown error fetching referrer data')
      Logger.showError(error)
    }
  }

  setInviteCode = (value: string) => {
    this.props.hideAlert()
    this.setState({ inviteCode: value })
  }

  setName = (value: string) => {
    this.setState({ name: value })
  }

  submit = () => {
    this.setState({ isSubmitting: true })
    this.props.hideAlert()
    const validCode = extractValidInviteCode(this.state.inviteCode)
    if (!validCode) {
      CeloAnalytics.track(CustomEventNames.signup_submit, {
        fullName: this.state.name, // PILOT_ONLY
        inviteCode: this.state.inviteCode,
        success: false,
      })
      this.props.showError(ErrorMessages.INVALID_INVITATION, ERROR_BANNER_DURATION)
      return
    }
    CeloAnalytics.track(CustomEventNames.signup_submit, {
      fullName: this.state.name, // PILOT_ONLY
      inviteCode: this.state.inviteCode,
      success: true,
    })
    this.props.redeemInvite(validCode, this.state.name)
  }

  import = async () => {
    navigate(Screens.ImportWallet)
  }

  focusOnCode = () => {
    if (this.codeInput.current) {
      this.codeInput.current.focus()
    }
  }

  scrollToEnd = () => {
    setTimeout(() => {
      if (this.scrollView && this.scrollView.current) {
        this.scrollView.current.scrollToEnd()
      }
    }, 1000) // This timeout must long enough or it doesnt not work
  }

  render() {
    const { t, error } = this.props
    const { inviteCode, name } = this.state

    return (
      <View style={styles.container}>
        <DevSkipButton nextScreen={Screens.VerifyEducation} />
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
          ref={this.scrollView}
        >
          <DisconnectBanner />
          <NuxLogo />
          {!this.state.isSubmitting ? (
            <View>
              <Text style={[fontStyles.h1, styles.darkCenter]} testID="InviteWallTitle">
                {' '}
                {t('welcomeCelo')}
              </Text>
              <Text style={[fontStyles.body, styles.body]}>{t('inviteText.0')}</Text>
              <Text style={[fontStyles.body, styles.body]}>
                {t('inviteText.1')}
                <Text onPress={goToCeloSite} style={fontStyles.bodyLink}>
                  {t('inviteText.2')}
                </Text>
              </Text>
              <Text style={[fontStyles.bodySmall, styles.darkCenter]}>{t('enterFullName')}</Text>
              <View style={componentStyles.row}>
                <TextInput
                  onFocus={this.scrollToEnd}
                  onChangeText={this.setName}
                  value={name}
                  style={componentStyles.input}
                  placeholderTextColor={colors.inactive}
                  underlineColorAndroid="transparent"
                  enablesReturnKeyAutomatically={true}
                  onSubmitEditing={this.focusOnCode}
                  placeholder={t('fullName')}
                  testID={'NameEntry'}
                />
              </View>
              <View
                style={[
                  componentStyles.row,
                  { borderColor: hasDisplayedError(error) ? '#FF0000' : colors.inactive },
                ]}
              >
                <TextInput
                  onFocus={this.scrollToEnd}
                  ref={this.codeInput}
                  onChangeText={this.setInviteCode}
                  value={inviteCode}
                  style={componentStyles.input}
                  placeholderTextColor={colors.inactive}
                  underlineColorAndroid="transparent"
                  enablesReturnKeyAutomatically={true}
                  placeholder={t('InvitationCode')}
                  onSubmitEditing={this.submit}
                  testID={'InviteCodeEntry'}
                />
              </View>
            </View>
          ) : (
            <View>
              <Text style={[fontStyles.h1, styles.darkCenter]}> {t('redeemingInvite')}</Text>
              <View style={styles.spacer} />
              <Text style={[fontStyles.paragraph, styles.darkCenter, styles.description]}>
                {t('redeemingDescription')}
              </Text>
              <View style={styles.spacer} />
              <ActivityIndicator size="large" color={colors.celoGreen} />
            </View>
          )}
        </ScrollView>
        <View style={styles.bottomContainer}>
          <Text style={[styles.dark, styles.askInvite]}>
            <Text style={[fontStyles.bodySmallBold, styles.askInvite]}>
              {t('inviteText.askForInvite.0')}
            </Text>
            {t('inviteText.askForInvite.1')}
            <Text
              onPress={goToWalletLandingPage}
              style={[fontStyles.bodySmallBold, fontStyles.linkInline, styles.askInvite]}
            >
              {t('inviteText.askForInvite.2')}
            </Text>
          </Text>
          <GethAwareButton
            standard={false}
            type={BtnTypes.PRIMARY}
            text={t('optIn')}
            onPress={this.submit}
            disabled={!this.state.inviteCode || this.state.isSubmitting}
            testID={'RedeemInviteButton'}
          />
          <View style={styles.importWallet}>
            <Text style={[fontStyles.bodySmall, styles.dark]}>{t('haveWallet')}</Text>
            <Link
              style={[fontStyles.bodySmall, fontStyles.linkInline]}
              onPress={this.import}
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
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingTop: 20,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  darkCenter: {
    textAlign: 'center',
    color: colors.dark,
  },
  body: {
    color: colors.dark,
    paddingLeft: 10,
    paddingBottom: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dark: {
    color: colors.dark,
  },
  bottomContainer: {
    backgroundColor: colors.background,
  },
  importWallet: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    marginVertical: 17,
  },
  spacer: {
    height: 30,
  },
  description: {
    padding: 30,
  },
  askInvite: {
    fontSize: 12,
    fontWeight: '300',
    marginTop: 10,
    width: 320,
    alignSelf: 'center',
    textAlign: 'center',
    marginBottom: 5,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      redeemInvite,
      showError,
      hideAlert,
    }
  )(withNamespaces(Namespaces.nuxNamePin1)(RedeemInvite))
)
