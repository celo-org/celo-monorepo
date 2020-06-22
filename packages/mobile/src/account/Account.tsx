import Link from '@celo/react-components/components/Link'
import colors from '@celo/react-components/styles/colors.v2'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { isE164Number } from '@celo/utils/src/phoneNumbers'
import { StackScreenProps } from '@react-navigation/stack'
import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Clipboard, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { devModeTriggerClicked, toggleBackupState } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import SettingsItem from 'src/account/SettingsItem'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { resetAppOpenedState, setAnalyticsEnabled, setNumberVerified } from 'src/app/actions'
import { AvatarSelf } from 'src/components/AvatarSelf'
import { FAQ_LINK, TOS_LINK } from 'src/config'
import { features } from 'src/flags'
import { Namespaces, withTranslation } from 'src/i18n'
import { revokeVerification } from 'src/identity/actions'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigateProtected } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { navigateToURI, navigateToVerifierApp } from 'src/utils/linking'
import Logger from 'src/utils/Logger'

interface DispatchProps {
  revokeVerification: typeof revokeVerification
  setNumberVerified: typeof setNumberVerified
  resetAppOpenedState: typeof resetAppOpenedState
  setAnalyticsEnabled: typeof setAnalyticsEnabled
  toggleBackupState: typeof toggleBackupState
  devModeTriggerClicked: typeof devModeTriggerClicked
}

interface StateProps {
  account: string | null
  e164PhoneNumber: string | null
  devModeActive: boolean
  analyticsEnabled: boolean
  numberVerified: boolean
  pincodeType: PincodeType
  backupCompleted: boolean
}

type OwnProps = StackScreenProps<StackParamList, Screens.Account>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

interface State {
  version: string
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
    account: state.web3.account,
    devModeActive: state.account.devModeActive || false,
    e164PhoneNumber: state.account.e164PhoneNumber,
    analyticsEnabled: state.app.analyticsEnabled,
    numberVerified: state.app.numberVerified,
    pincodeType: pincodeTypeSelector(state),
  }
}

const mapDispatchToProps = {
  revokeVerification,
  setNumberVerified,
  resetAppOpenedState,
  setAnalyticsEnabled,
  toggleBackupState,
  devModeTriggerClicked,
}

export class Account extends React.Component<Props, State> {
  state: State = {
    version: DeviceInfo.getVersion(),
  }

  goToProfile = () => {
    CeloAnalytics.track(CustomEventNames.edit_profile)
    this.props.navigation.navigate(Screens.Profile)
  }

  goToBackupScreen = () => {
    if (this.props.backupCompleted) {
      navigateProtected(Screens.BackupIntroduction, { fromAccountScreen: true })
    } else {
      this.props.navigation.navigate(Screens.BackupIntroduction)
    }
  }

  goToVerification = () => {
    this.props.navigation.navigate(Screens.VerificationEducationScreen)
  }

  goToInvite = () => {
    this.props.navigation.navigate(Screens.Invite)
  }

  goToLanguageSetting = () => {
    this.props.navigation.navigate(Screens.Language, { nextScreen: 'GO_BACK' })
  }

  goToLocalCurrencySetting = () => {
    this.props.navigation.navigate(Screens.SelectLocalCurrency)
  }

  goToLicenses = () => {
    this.props.navigation.navigate(Screens.Licenses)
  }

  goToSupport = () => {
    this.props.navigation.navigate(Screens.Support)
  }

  goToSecurity = () => {
    navigateProtected(Screens.Security)
  }

  goToAnalytics = () => {
    this.props.navigation.navigate(Screens.Analytics)
  }

  goToDataSaver = () => {
    this.props.navigation.navigate(Screens.DataSaver, { promptModalVisible: false })
  }

  goToFAQ() {
    navigateToURI(FAQ_LINK)
  }

  goToTerms() {
    navigateToURI(TOS_LINK)
  }

  goToFiatExchange = () => {
    this.props.navigation.navigate(Screens.FiatExchange)
  }

  resetAppOpenedState = () => {
    this.props.resetAppOpenedState()
    Logger.showMessage('App onboarding state reset.')
  }

  toggleNumberVerified = () => {
    this.props.setNumberVerified(!this.props.numberVerified)
  }

  revokeNumberVerification = async () => {
    if (this.props.e164PhoneNumber && !isE164Number(this.props.e164PhoneNumber)) {
      Logger.showMessage('Cannot revoke verificaton: number invalid')
      return
    }
    Logger.showMessage(`Revoking verification`)
    this.props.revokeVerification()
  }

  toggleBackupState = () => {
    this.props.toggleBackupState()
  }

  showDebugScreen = () => {
    this.props.navigation.navigate(Screens.Debug)
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

    if (!devModeActive) {
      return null
    } else {
      return (
        <View style={style.devSettings}>
          {/* <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={this.revokeNumberVerification}>
              <Text>Revoke Number Verification</Text>
            </TouchableOpacity>
          </View> */}
          <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={this.toggleNumberVerified}>
              <Text>Toggle verification done</Text>
            </TouchableOpacity>
          </View>
          <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={this.resetAppOpenedState}>
              <Text>Reset app opened state</Text>
            </TouchableOpacity>
          </View>

          <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={this.toggleBackupState}>
              <Text>Toggle backup state</Text>
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
    const { t, account, numberVerified, pincodeType } = this.props
    const showSecurity = pincodeType === PincodeType.CustomPin

    return (
      <SafeAreaView style={style.container}>
        <DrawerTopBar />
        <ScrollView>
          <View style={style.accountProfile}>
            {/* TouchableNoFeedback doesn't work here for some reason */}
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
            {features.SHOW_ADD_FUNDS && (
              <SettingsItem title={t('addFunds')} onPress={this.goToFiatExchange} />
            )}
            <SettingsItem
              title={t('backupKeyFlow6:backupAndRecovery')}
              onPress={this.goToBackupScreen}
            />
            {!numberVerified && (
              <SettingsItem
                title={t('nuxVerification2:getVerified')}
                onPress={this.goToVerification}
              />
            )}
            <SettingsItem title={t('invite')} onPress={this.goToInvite} />
            <SettingsItem title={t('editProfile')} onPress={this.goToProfile} />
            {features.SHOW_SHOW_REWARDS_APP_LINK && (
              <SettingsItem title={t('celoRewards')} onPress={navigateToVerifierApp} />
            )}
            {showSecurity && <SettingsItem title={t('security')} onPress={this.goToSecurity} />}
            <SettingsItem title={t('analytics')} onPress={this.goToAnalytics} />
            {features.DATA_SAVER && (
              <SettingsItem title={t('dataSaver')} onPress={this.goToDataSaver} />
            )}
            <SettingsItem title={t('languageSettings')} onPress={this.goToLanguageSetting} />
            <SettingsItem
              title={t('localCurrencySetting')}
              onPress={this.goToLocalCurrencySetting}
            />
            <SettingsItem title={t('licenses')} onPress={this.goToLicenses} />
            <SettingsItem title={t('support')} onPress={this.goToSupport} />
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
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
  },
  accountProfile: {
    paddingVertical: 8,
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
  containerList: {
    flex: 1,
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

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.accountScreen10)(Account))
