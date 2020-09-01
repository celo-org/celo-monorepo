import SectionHeadNew from '@celo/react-components/components/SectionHeadNew'
import {
  SettingsExpandedItem,
  SettingsItemSwitch,
  SettingsItemTextValue,
} from '@celo/react-components/components/SettingsItem'
import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { isE164Number } from '@celo/utils/src/phoneNumbers'
import { StackScreenProps } from '@react-navigation/stack'
import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { clearStoredAccount, devModeTriggerClicked, toggleBackupState } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import { SettingsEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  resetAppOpenedState,
  setAnalyticsEnabled,
  setNumberVerified,
  setRequirePinOnAppOpen,
  setSessionId,
} from 'src/app/actions'
import { sessionIdSelector, verificationPossibleSelector } from 'src/app/selectors'
import Dialog from 'src/components/Dialog'
import SessionId from 'src/components/SessionId'
import { AVAILABLE_LANGUAGES, TOS_LINK } from 'src/config'
import { Namespaces, withTranslation } from 'src/i18n'
import { revokeVerification } from 'src/identity/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import DrawerTopBar from 'src/navigator/DrawerTopBar'
import { navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { restartApp } from 'src/utils/AppRestart'
import { navigateToURI } from 'src/utils/linking'
import Logger from 'src/utils/Logger'
import { toggleFornoMode } from 'src/web3/actions'

interface DispatchProps {
  revokeVerification: typeof revokeVerification
  setNumberVerified: typeof setNumberVerified
  resetAppOpenedState: typeof resetAppOpenedState
  setAnalyticsEnabled: typeof setAnalyticsEnabled
  toggleBackupState: typeof toggleBackupState
  devModeTriggerClicked: typeof devModeTriggerClicked
  setRequirePinOnAppOpen: typeof setRequirePinOnAppOpen
  toggleFornoMode: typeof toggleFornoMode
  setSessionId: typeof setSessionId
  clearStoredAccount: typeof clearStoredAccount
}

interface StateProps {
  account: string | null
  e164PhoneNumber: string | null
  devModeActive: boolean
  analyticsEnabled: boolean
  numberVerified: boolean
  verificationPossible: boolean
  pincodeType: PincodeType
  backupCompleted: boolean
  requirePinOnAppOpen: boolean
  fornoEnabled: boolean
  gethStartedThisSession: boolean
  preferredCurrencyCode: LocalCurrencyCode
  sessionId: string
}

type OwnProps = StackScreenProps<StackParamList, Screens.Settings>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
    account: state.web3.account,
    devModeActive: state.account.devModeActive || false,
    e164PhoneNumber: state.account.e164PhoneNumber,
    analyticsEnabled: state.app.analyticsEnabled,
    numberVerified: state.app.numberVerified,
    verificationPossible: verificationPossibleSelector(state),
    pincodeType: pincodeTypeSelector(state),
    requirePinOnAppOpen: state.app.requirePinOnAppOpen,
    fornoEnabled: state.web3.fornoMode,
    gethStartedThisSession: state.geth.gethStartedThisSession,
    preferredCurrencyCode: getLocalCurrencyCode(state),
    sessionId: sessionIdSelector(state),
  }
}

const mapDispatchToProps = {
  revokeVerification,
  setNumberVerified,
  resetAppOpenedState,
  setAnalyticsEnabled,
  toggleBackupState,
  devModeTriggerClicked,
  setRequirePinOnAppOpen,
  toggleFornoMode,
  setSessionId,
  clearStoredAccount,
}

interface State {
  fornoSwitchOffWarning: boolean
  showAccountKeyModal: boolean
}

export class Account extends React.Component<Props, State> {
  componentDidMount = () => {
    const sessionId = ValoraAnalytics.getSessionId()
    if (sessionId !== this.props.sessionId) {
      this.props.setSessionId(sessionId)
    }
  }

  goToProfile = () => {
    ValoraAnalytics.track(SettingsEvents.settings_profile_edit)
    this.props.navigation.navigate(Screens.Profile)
  }

  goToConfirmNumber = () => {
    ValoraAnalytics.track(SettingsEvents.settings_verify_number)
    this.props.navigation.navigate(Screens.VerificationEducationScreen, {
      hideOnboardingStep: true,
    })
  }

  goToLanguageSetting = () => {
    this.props.navigation.navigate(Screens.Language, { nextScreen: this.props.route.name })
  }

  goToLocalCurrencySetting = () => {
    this.props.navigation.navigate(Screens.SelectLocalCurrency)
  }

  goToLicenses = () => {
    this.props.navigation.navigate(Screens.Licenses)
    ValoraAnalytics.track(SettingsEvents.licenses_view)
  }

  goToSupport = () => {
    this.props.navigation.navigate(Screens.Support)
  }

  resetAppOpenedState = () => {
    this.props.resetAppOpenedState()
    Logger.showMessage('App onboarding state reset.')
  }

  toggleNumberVerified = () => {
    this.props.setNumberVerified(!this.props.numberVerified)
  }

  revokeNumberVerification = () => {
    if (this.props.e164PhoneNumber && !isE164Number(this.props.e164PhoneNumber)) {
      Logger.showError('Cannot revoke verificaton: number invalid')
      return
    }
    Logger.showMessage('Revoking verification')
    this.props.revokeVerification()
  }

  toggleBackupState = () => {
    this.props.toggleBackupState()
  }

  showDebugScreen = () => {
    this.props.navigation.navigate(Screens.Debug)
  }

  onDevSettingsTriggerPress = () => {
    this.props.devModeTriggerClicked()
  }

  getDevSettingsComp() {
    const { devModeActive } = this.props

    if (!devModeActive) {
      return null
    } else {
      return (
        <View style={styles.devSettings}>
          <View style={styles.devSettingsItem}>
            <Text style={fontStyles.label}>Session ID</Text>
            <SessionId sessionId={this.props.sessionId || ''} />
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.toggleNumberVerified}>
              <Text>Toggle verification done</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.revokeNumberVerification}>
              <Text>Revoke Number Verification</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.resetAppOpenedState}>
              <Text>Reset app opened state</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.toggleBackupState}>
              <Text>Toggle backup state</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.showDebugScreen}>
              <Text>Show Debug Screen</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={Sentry.nativeCrash}>
              <Text>Trigger a crash</Text>
            </TouchableOpacity>
          </View>
        </View>
      )
    }
  }

  handleRequirePinToggle = (value: boolean) => {
    this.props.setRequirePinOnAppOpen(value)
    ValoraAnalytics.track(SettingsEvents.pin_require_on_load, {
      enabled: value,
    })
  }

  disableFornoMode = () => {
    this.props.toggleFornoMode(false)
    this.hideFornoSwitchOffWarning()
    setTimeout(() => restartApp(), 2000)
  }

  handleFornoToggle = (fornoMode: boolean) => {
    if (!fornoMode && this.props.gethStartedThisSession) {
      // Starting geth a second time this app session which will
      // require an app restart, so show restart modal
      this.showFornoSwitchOffWarning()
    } else {
      this.props.toggleFornoMode(fornoMode)
    }
  }

  showFornoSwitchOffWarning = () => {
    this.setState({ fornoSwitchOffWarning: true })
  }

  hideFornoSwitchOffWarning = () => {
    this.setState({ fornoSwitchOffWarning: false })
  }

  onPressPromptModal = () => {
    this.props.toggleFornoMode(true)
    navigateBack()
  }

  hidePromptModal = () => {
    this.props.toggleFornoMode(false)
    navigateBack()
  }

  onTermsPress() {
    navigateToURI(TOS_LINK)
    ValoraAnalytics.track(SettingsEvents.tos_view)
  }

  onRemoveAccountPress = () => {
    this.setState({ showAccountKeyModal: true })
  }

  hideRemoveAccountModal = () => {
    this.setState({ showAccountKeyModal: false })
  }

  onPressContinueWithAccountRemoval = () => {
    ValoraAnalytics.track(SettingsEvents.start_account_removal)
    this.setState({ showAccountKeyModal: false })
    this.props.navigation.navigate(Screens.BackupPhrase, { navigatedFromSettings: true })
  }

  hideConfirmRemovalModal = () => {
    this.props.navigation.setParams({ promptConfirmRemovalModal: false })
  }

  confirmAccountRemoval = () => {
    ValoraAnalytics.track(SettingsEvents.completed_account_removal)
    this.props.clearStoredAccount(this.props.account || '')
  }

  render() {
    const { t, i18n, numberVerified, verificationPossible } = this.props
    const promptFornoModal = this.props.route.params?.promptFornoModal ?? false
    const promptConfirmRemovalModal = this.props.route.params?.promptConfirmRemovalModal ?? false
    const currentLanguage = AVAILABLE_LANGUAGES.find((l) => l.code === i18n.language)
    return (
      <SafeAreaView style={styles.container}>
        <DrawerTopBar />
        <ScrollView>
          <TouchableWithoutFeedback onPress={this.onDevSettingsTriggerPress}>
            <Text style={styles.title} testID={'SettingsTitle'}>
              {t('global:settings')}
            </Text>
          </TouchableWithoutFeedback>
          <View style={styles.containerList}>
            <SettingsItemTextValue title={t('editProfile')} onPress={this.goToProfile} />
            {!numberVerified && verificationPossible && (
              <SettingsItemTextValue title={t('confirmNumber')} onPress={this.goToConfirmNumber} />
            )}
            <SettingsItemTextValue
              title={t('languageSettings')}
              value={currentLanguage?.name ?? t('global:unknown')}
              onPress={this.goToLanguageSetting}
            />
            <SettingsItemTextValue
              title={t('localCurrencySetting')}
              value={this.props.preferredCurrencyCode}
              onPress={this.goToLocalCurrencySetting}
            />
            <SectionHeadNew text={t('securityAndData')} style={styles.sectionTitle} />
            <SettingsItemSwitch
              title={t('requirePinOnAppOpen')}
              value={this.props.requirePinOnAppOpen}
              onValueChange={this.handleRequirePinToggle}
            />
            <SettingsItemSwitch
              title={t('enableDataSaver')}
              value={this.props.fornoEnabled}
              onValueChange={this.handleFornoToggle}
              details={t('dataSaverDetail')}
            />
            <SettingsItemSwitch
              title={t('shareAnalytics')}
              value={this.props.analyticsEnabled}
              onValueChange={this.props.setAnalyticsEnabled}
              details={t('shareAnalytics_detail')}
            />
            <SectionHeadNew text={t('legal')} style={styles.sectionTitle} />
            <SettingsItemTextValue title={t('licenses')} onPress={this.goToLicenses} />
            <SettingsItemTextValue title={t('termsOfServiceLink')} onPress={this.onTermsPress} />
            <SectionHeadNew text={''} style={styles.sectionTitle} />
            <SettingsExpandedItem
              title={t('removeAccountTitle')}
              details={t('removeAccountDetails')}
              onPress={this.onRemoveAccountPress}
            />
          </View>
          {this.getDevSettingsComp()}
          <Dialog
            isVisible={this.state?.fornoSwitchOffWarning}
            title={t('restartModalSwitchOff.header')}
            actionText={t('restartModalSwitchOff.restart')}
            actionPress={this.disableFornoMode}
            secondaryActionText={t('global:cancel')}
            secondaryActionPress={this.hideFornoSwitchOffWarning}
          >
            {t('restartModalSwitchOff.body')}
          </Dialog>
          <Dialog
            isVisible={promptFornoModal}
            title={t('promptFornoModal.header')}
            actionText={t('promptFornoModal.switchToDataSaver')}
            actionPress={this.onPressPromptModal}
            secondaryActionText={t('global:goBack')}
            secondaryActionPress={this.hidePromptModal}
          >
            {t('promptFornoModal.body')}
          </Dialog>
          <Dialog
            isVisible={this.state?.showAccountKeyModal}
            title={t('accountKeyModal.header')}
            actionText={t('global:continue')}
            actionPress={this.onPressContinueWithAccountRemoval}
            secondaryActionText={t('global:cancel')}
            secondaryActionPress={this.hideRemoveAccountModal}
          >
            {t('accountKeyModal.body1')}
            {'\n\n'}
            {t('accountKeyModal.body2')}
          </Dialog>
          <Dialog
            isVisible={promptConfirmRemovalModal}
            title={t('promptConfirmRemovalModal.header')}
            actionText={t('promptConfirmRemovalModal.resetNow')}
            actionPress={this.confirmAccountRemoval}
            secondaryActionText={t('global:cancel')}
            secondaryActionPress={this.hideConfirmRemovalModal}
          >
            {t('promptConfirmRemovalModal.body')}
          </Dialog>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    ...fontStyles.h1,
    margin: 16,
  },
  containerList: {
    flex: 1,
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
  sectionTitle: {
    marginTop: 44,
    marginLeft: 16,
    paddingLeft: 0,
    borderBottomColor: colors.gray2,
    borderBottomWidth: 1,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(
  mapStateToProps,
  mapDispatchToProps
)(withTranslation<Props>(Namespaces.accountScreen10)(Account))
