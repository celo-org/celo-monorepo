import Link from '@celo/react-components/components/Link'
import SmallButton from '@celo/react-components/components/SmallButton'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { anonymizedPhone, isE164Number } from '@celo/utils/src/phoneNumbers'
import * as React from 'react'
import { Trans, WithNamespaces, withNamespaces } from 'react-i18next'
import { Clipboard, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { Sentry } from 'react-native-sentry'
import { connect } from 'react-redux'
import AccountInfo from 'src/account/AccountInfo'
import SettingsItem from 'src/account/SettingsItem'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { resetAppOpenedState, setAnalyticsEnabled, setNumberVerified } from 'src/app/actions'
import BackButton from 'src/components/BackButton'
import { FAQ_LINK, TOS_LINK } from 'src/config'
import { features } from 'src/flags'
import { Namespaces } from 'src/i18n'
import { revokeVerification } from 'src/identity/actions'
import { isPhoneNumberVerified } from 'src/identity/verification'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { navigateToURI, navigateToVerifierApp } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

interface DispatchProps {
  revokeVerification: typeof revokeVerification
  setNumberVerified: typeof setNumberVerified
  resetAppOpenedState: typeof resetAppOpenedState
  setAnalyticsEnabled: typeof setAnalyticsEnabled
}

interface StateProps {
  account: string | null
  e164PhoneNumber: string
  devModeActive: boolean
  backupCompleted: boolean
  analyticsEnabled: boolean
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  verified: boolean | undefined
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    account: state.web3.account,
    devModeActive: state.account.devModeActive || false,
    e164PhoneNumber: state.account.e164PhoneNumber,
    backupCompleted: state.account.backupCompleted,
    analyticsEnabled: state.app.analyticsEnabled,
  }
}

const mapDispatchToProps = {
  revokeVerification,
  setNumberVerified,
  resetAppOpenedState,
  setAnalyticsEnabled,
}

export class Account extends React.Component<Props, State> {
  static navigationOptions = {
    headerStyle: {
      elevation: 0,
    },
    headerLeftContainerStyle: { paddingHorizontal: 20 },
    headerLeft: <BackButton />,
  }

  state: State = {
    verified: undefined,
  }

  async componentDidMount() {
    const phoneNumber = this.props.e164PhoneNumber
    const verified = await isPhoneNumberVerified(phoneNumber)
    this.setState({ verified })
  }

  goToProfile = () => {
    CeloAnalytics.track(CustomEventNames.edit_profile)
    navigate(Screens.Profile)
  }

  backupScreen() {
    navigate(Screens.Backup)
  }

  goToInvite() {
    navigate(Screens.Invite)
  }

  goToLanguageSetting() {
    navigate(Screens.Language, { nextScreen: Screens.Account })
  }

  goToLicenses() {
    navigate(Screens.Licenses)
  }

  goToAnalytics() {
    navigate(Screens.Analytics, { nextScreen: Screens.Account })
  }

  goToFAQ() {
    navigateToURI({
      uri: FAQ_LINK,
    })
  }

  goToTerms() {
    navigateToURI({
      uri: TOS_LINK,
    })
  }

  resetAppOpenedState = () => {
    this.props.resetAppOpenedState()
    Logger.showMessage('App onboarding state reset.')
  }

  revokeNumberVerification = async () => {
    if (!isE164Number(this.props.e164PhoneNumber)) {
      Logger.showMessage('Cannot revoke verificaton: number invalid')
      return
    }
    Logger.showMessage(`Revoking verification`)
    this.props.revokeVerification()
  }

  showDebugScreen = async () => {
    navigate(Screens.Debug)
  }

  sendLogsToSupport = async () => {
    if (this.props.e164PhoneNumber) {
      Logger.emailLogsToSupport(anonymizedPhone(this.props.e164PhoneNumber))
    }
  }

  onCopyAddressClick = () => {
    const { account, t } = this.props
    if (!account) {
      return
    }
    Clipboard.setString(account)
    Logger.showMessage(t('addressCopied'))
  }

  getDevSettingsComp() {
    const { devModeActive } = this.props
    const { verified } = this.state

    if (!devModeActive) {
      return null
    } else {
      return (
        <View style={style.devSettings}>
          <View style={style.devSettingsItem}>
            <Text>Dev Settings</Text>
            <View>
              {verified === undefined && <Text>Checking Verification</Text>}
              {verified === true && <Text>Verified</Text>}
              {verified === false && <Text>Not Verified</Text>}
            </View>
          </View>
          <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={this.revokeNumberVerification}>
              <Text>Revoke Number Verification</Text>
            </TouchableOpacity>
          </View>
          <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={this.resetAppOpenedState}>
              <Text>Reset app opened state</Text>
            </TouchableOpacity>
          </View>
          <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={this.showDebugScreen}>
              <Text>Show Debug Screen</Text>
            </TouchableOpacity>
          </View>
          <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={Sentry.nativeCrash}>
              <Text>Trigger a crash</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }
  }

  render() {
    const { t, backupCompleted, account } = this.props

    return (
      <ScrollView style={style.scrollView}>
        <DisconnectBanner />
        <View style={style.accountProfile}>
          <AccountInfo />
          <View>
            <TouchableOpacity onPress={this.onCopyAddressClick}>
              <Text numberOfLines={1} ellipsizeMode={'tail'} style={style.addressText}>
                {account}
              </Text>
            </TouchableOpacity>
          </View>
          <SmallButton
            text={t('editProfile')}
            testID={'editProfileButton'}
            onPress={this.goToProfile}
            solid={false}
            style={style.buttonSpacing}
          />
        </View>
        <View style={style.containerList}>
          {!backupCompleted ? (
            <SettingsItem title={t('backupKey')} onPress={this.backupScreen} />
          ) : null}
          <SettingsItem title={t('invite')} onPress={this.goToInvite} />
          {features.SHOW_SHOW_REWARDS_APP_LINK && (
            <SettingsItem title={t('celoRewards')} onPress={navigateToVerifierApp} />
          )}
          <SettingsItem title={t('analytics')} onPress={this.goToAnalytics} />
          <SettingsItem title={t('languageSettings')} onPress={this.goToLanguageSetting} />
          <SettingsItem title={t('licenses')} onPress={this.goToLicenses} />
          <SettingsItem title={t('sendIssueReport')} onPress={this.sendLogsToSupport} />
        </View>
        {this.getDevSettingsComp()}

        <View style={style.accountFooter}>
          {DeviceInfo.getVersion() && (
            <View style={style.accountFooterText}>
              <Text style={fontStyles.bodySmall}>
                {t('version') + ' ' + DeviceInfo.getVersion()}
              </Text>
            </View>
          )}
          <View style={style.accountFooterText}>
            <Trans i18nKey="testFaqHere">
              <Text style={fontStyles.bodySmall}>Test FAQ is </Text>
              <Link style={[fontStyles.bodySmall, fontStyles.linkInline]} onPress={this.goToFAQ}>
                here
              </Link>
            </Trans>
          </View>
          <View style={style.accountFooterText}>
            <Trans i18nKey="termsOfServiceHere">
              <Text style={fontStyles.bodySmall}>Terms of service are </Text>
              <Link style={[fontStyles.bodySmall, fontStyles.linkInline]} onPress={this.goToTerms}>
                here
              </Link>
            </Trans>
          </View>
        </View>
      </ScrollView>
    )
  }
}

const style = StyleSheet.create({
  accountProfile: {
    paddingBottom: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  accountFooter: {
    marginTop: 30,
    flexDirection: 'column',
    alignItems: 'center',
  },
  accountFooterText: {
    flexDirection: 'row',
    paddingBottom: 10,
  },
  scrollView: {
    flex: 1,
    backgroundColor: 'white',
  },
  containerList: {
    flex: 1,
    paddingLeft: 20,
    borderTopWidth: 1,
    borderColor: '#EEEEEE',
  },
  devSettings: {
    alignItems: 'flex-start',
    padding: 15,
    marginHorizontal: 10,
  },
  devSettingsItem: {
    alignSelf: 'stretch',
    margin: 4,
  },
  buttonSpacing: {
    marginTop: 10,
    alignSelf: 'center',
  },
  addressText: {
    ...fontStyles.bodySmall,
    ...fontStyles.light,
    color: colors.dark,
    marginTop: 8,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withNamespaces(Namespaces.accountScreen10)(Account))
