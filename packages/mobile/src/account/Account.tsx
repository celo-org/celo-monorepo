import Link from '@celo/react-components/components/Link'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { anonymizedPhone, isE164Number } from '@celo/utils/src/phoneNumbers'
import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Clipboard, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { devModeTriggerClicked, resetBackupState } from 'src/account/actions'
import SettingsItem from 'src/account/SettingsItem'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { resetAppOpenedState, setAnalyticsEnabled, setNumberVerified } from 'src/app/actions'
import { AvatarSelf } from 'src/components/AvatarSelf'
import { FAQ_LINK, TOS_LINK } from 'src/config'
import { features } from 'src/flags'
import { Namespaces } from 'src/i18n'
import { revokeVerification } from 'src/identity/actions'
import { isPhoneNumberVerified } from 'src/identity/verification'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { navigateToURI, navigateToVerifierApp } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

interface DispatchProps {
  revokeVerification: typeof revokeVerification
  setNumberVerified: typeof setNumberVerified
  resetAppOpenedState: typeof resetAppOpenedState
  setAnalyticsEnabled: typeof setAnalyticsEnabled
  resetBackupState: typeof resetBackupState
  devModeTriggerClicked: typeof devModeTriggerClicked
}

interface StateProps {
  account: string | null
  e164PhoneNumber: string
  devModeActive: boolean
  analyticsEnabled: boolean
}

type Props = StateProps & DispatchProps & WithNamespaces

interface State {
  verified: boolean | undefined
  version: string
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    account: state.web3.account,
    devModeActive: state.account.devModeActive || false,
    e164PhoneNumber: state.account.e164PhoneNumber,
    analyticsEnabled: state.app.analyticsEnabled,
  }
}

const mapDispatchToProps = {
  revokeVerification,
  setNumberVerified,
  resetAppOpenedState,
  setAnalyticsEnabled,
  resetBackupState,
  devModeTriggerClicked,
}

export class Account extends React.Component<Props, State> {
  static navigationOptions = headerWithBackButton

  state: State = {
    verified: undefined,
    version: '',
  }

  async componentDidMount() {
    const phoneNumber = this.props.e164PhoneNumber
    const verified = await isPhoneNumberVerified(phoneNumber)
    this.setState({ verified })
    this.setState({ version: DeviceInfo.getVersion() })
  }

  goToProfile = () => {
    CeloAnalytics.track(CustomEventNames.edit_profile)
    navigate(Screens.Profile)
  }

  backupScreen() {
    navigate(Screens.BackupIntroduction)
  }

  goToInvite() {
    navigate(Screens.Invite)
  }

  goToLanguageSetting() {
    navigate(Screens.Language, { nextScreen: Screens.Account })
  }

  goToLocalCurrencySetting() {
    navigate(Screens.SelectLocalCurrency)
  }

  goToLicenses() {
    navigate(Screens.Licenses)
  }

  goToAnalytics() {
    navigate(Screens.Analytics, { nextScreen: Screens.Account })
  }

  goToCeloLite() {
    navigate(Screens.CeloLite, { nextScreen: Screens.Account })
  }

  goToFAQ() {
    navigateToURI(FAQ_LINK)
  }

  goToTerms() {
    navigateToURI(TOS_LINK)
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

  resetBackupState = () => {
    this.props.resetBackupState()
  }

  showDebugScreen = async () => {
    navigate(Screens.Debug)
  }

  sendLogsToSupport = async () => {
    if (this.props.e164PhoneNumber) {
      await Logger.emailLogsToSupport(anonymizedPhone(this.props.e164PhoneNumber))
    }
  }

  onPressAddress = () => {
    const { account, t } = this.props
    if (!account) {
      return
    }
    Clipboard.setString(account)
    Logger.showMessage(t('addressCopied'))
  }

  onPressAvatar = () => {
    this.props.devModeTriggerClicked()
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
            <TouchableOpacity onPress={this.resetBackupState}>
              <Text>Reset backup state</Text>
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
    const { t, account } = this.props

    return (
      <ScrollView style={style.scrollView}>
        <SafeAreaView>
          <View style={style.accountProfile}>
            <TouchableOpacity onPress={this.onPressAvatar}>
              <AvatarSelf />
            </TouchableOpacity>
            <View>
              <TouchableOpacity onPress={this.onPressAddress}>
                <Text numberOfLines={1} ellipsizeMode={'tail'} style={style.addressText}>
                  {account}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={style.containerList}>
            <SettingsItem
              title={t('backupKeyFlow6:backupAndRecovery')}
              onPress={this.backupScreen}
            />
            <SettingsItem title={t('invite')} onPress={this.goToInvite} />
            <SettingsItem title={t('editProfile')} onPress={this.goToProfile} />
            {features.SHOW_SHOW_REWARDS_APP_LINK && (
              <SettingsItem title={t('celoRewards')} onPress={navigateToVerifierApp} />
            )}
            <SettingsItem title={t('analytics')} onPress={this.goToAnalytics} />
            <SettingsItem title={t('celoLite')} onPress={this.goToCeloLite} />
            <SettingsItem title={t('languageSettings')} onPress={this.goToLanguageSetting} />
            <SettingsItem
              title={t('localCurrencySetting')}
              onPress={this.goToLocalCurrencySetting}
            />
            <SettingsItem title={t('licenses')} onPress={this.goToLicenses} />
            <SettingsItem title={t('sendIssueReport')} onPress={this.sendLogsToSupport} />
          </View>
          {this.getDevSettingsComp()}

          <View style={style.accountFooter}>
            <View style={style.accountFooterText}>
              <Text style={fontStyles.bodySmall}>{t('version') + ' ' + this.state.version}</Text>
            </View>
            <View style={style.accountFooterText}>
              <Link onPress={this.goToFAQ}>{t('testFaqLink')}</Link>
            </View>
            <View style={style.accountFooterText}>
              <Link onPress={this.goToTerms}>{t('termsOfServiceLink')}</Link>
            </View>
          </View>
        </SafeAreaView>
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
