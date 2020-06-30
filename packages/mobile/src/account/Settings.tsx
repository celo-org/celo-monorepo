import SectionHeadNew from '@celo/react-components/components/SectionHeadNew'
import {
  SettingsItemSwitch,
  SettingsItemTextValue,
} from '@celo/react-components/components/SettingsItem'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { isE164Number } from '@celo/utils/src/phoneNumbers'
import { StackScreenProps } from '@react-navigation/stack'
import * as Sentry from '@sentry/react-native'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { devModeTriggerClicked, toggleBackupState } from 'src/account/actions'
import { PincodeType } from 'src/account/reducer'
import { pincodeTypeSelector } from 'src/account/selectors'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import {
  resetAppOpenedState,
  setAnalyticsEnabled,
  setNumberVerified,
  setRequirePinOnAppOpen,
} from 'src/app/actions'
import { WarningModal } from 'src/components/WarningModal'
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
}

interface StateProps {
  account: string | null
  e164PhoneNumber: string | null
  devModeActive: boolean
  analyticsEnabled: boolean
  numberVerified: boolean
  pincodeType: PincodeType
  backupCompleted: boolean
  requirePinOnAppOpen: boolean
  fornoEnabled: boolean
  gethStartedThisSession: boolean
  preferredCurrencyCode: LocalCurrencyCode
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
    pincodeType: pincodeTypeSelector(state),
    requirePinOnAppOpen: state.app.requirePinOnAppOpen,
    fornoEnabled: state.web3.fornoMode,
    gethStartedThisSession: state.geth.gethStartedThisSession,
    preferredCurrencyCode: getLocalCurrencyCode(state),
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
}

interface State {
  fornoSwitchOffWarning: boolean
}

export class Account extends React.Component<Props, State> {
  goToProfile = () => {
    CeloAnalytics.track(CustomEventNames.edit_profile)
    this.props.navigation.navigate(Screens.Profile)
  }

  goToLanguageSetting = () => {
    this.props.navigation.navigate(Screens.Language, { fromSettings: true })
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

  getDevSettingsComp() {
    const { devModeActive } = this.props

    if (!devModeActive) {
      return null
    } else {
      return (
        <View style={styles.devSettings}>
          {/* 
          // TODO: It's commented because it broke a while back but this is something we'd like to re-enable
          <View style={style.devSettingsItem}>
            <TouchableOpacity onPress={this.revokeNumberVerification}>
              <Text>Revoke Number Verification</Text>
            </TouchableOpacity>
          </View> */}
          <View style={styles.devSettingsItem}>
            <TouchableOpacity onPress={this.toggleNumberVerified}>
              <Text>Toggle verification done</Text>
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

  disableFornoMode = () => {
    this.props.toggleFornoMode(false)
    this.hideFornoSwitchOffWarning()
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
  }

  render() {
    const { t, i18n } = this.props
    const promptFornoModal = this.props.route.params?.promptFornoModal ?? false
    const currentLanguage = AVAILABLE_LANGUAGES.find((l) => l.code === i18n.language)
    return (
      <SafeAreaView style={styles.container}>
        <DrawerTopBar />
        <ScrollView>
          <Text style={styles.title} testID={'SettingsTitle'}>
            {t('global:settings')}
          </Text>
          <View style={styles.containerList}>
            <SettingsItemTextValue title={t('editProfile')} onPress={this.goToProfile} />
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
              onValueChange={this.props.setRequirePinOnAppOpen}
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
          </View>
          {this.getDevSettingsComp()}
          <WarningModal
            isVisible={this.state?.fornoSwitchOffWarning}
            header={t('restartModalSwitchOff.header')}
            body1={t('restartModalSwitchOff.body')}
            continueTitle={t('restartModalSwitchOff.restart')}
            cancelTitle={t('global:cancel')}
            onCancel={this.hideFornoSwitchOffWarning}
            onContinue={this.disableFornoMode}
          />
          <WarningModal
            isVisible={promptFornoModal}
            header={t('promptFornoModal.header')}
            body1={t('promptFornoModal.body')}
            continueTitle={t('promptFornoModal.switchToDataSaver')}
            cancelTitle={t('global:goBack')}
            onCancel={this.hidePromptModal}
            onContinue={this.onPressPromptModal}
          />
        </ScrollView>
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
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
