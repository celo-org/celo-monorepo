import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, Keyboard, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationEvents, NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import {
  formatBackupPhraseOnEdit,
  formatBackupPhraseOnSubmit,
  isValidBackupPhrase,
} from 'src/backup/utils'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces, withTranslation } from 'src/i18n'
import BackupKeyIcon from 'src/icons/BackupKeyIcon'
import { importBackupPhrase } from 'src/import/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface State {
  backupPhrase: string
}

interface DispatchProps {
  importBackupPhrase: typeof importBackupPhrase
  hideAlert: typeof hideAlert
}

interface StateProps {
  isImportingWallet: boolean
}

type Props = StateProps & DispatchProps & WithTranslation & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isImportingWallet: state.imports.isImportingWallet,
  }
}

export class ImportWallet extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state = {
    backupPhrase: '',
  }

  checkCleanBackupPhrase = () => {
    const { navigation } = this.props
    if (navigation && navigation.getParam('clean')) {
      this.setState({
        backupPhrase: '',
      })
      navigation.setParams({ clean: false })
    }
  }

  setBackupPhrase = (input: string) => {
    this.props.hideAlert()
    this.setState({
      backupPhrase: formatBackupPhraseOnEdit(input),
    })
  }

  onPressRestore = () => {
    Keyboard.dismiss()
    this.props.hideAlert()
    CeloAnalytics.track(CustomEventNames.import_wallet_submit)

    const formattedPhrase = formatBackupPhraseOnSubmit(this.state.backupPhrase)
    this.setState({
      backupPhrase: formattedPhrase,
    })

    this.props.importBackupPhrase(formattedPhrase, false)
  }

  onPressRestoreSocial = () => {
    navigate(Screens.ImportWalletSocial)
  }

  render() {
    const { backupPhrase } = this.state
    const { t, isImportingWallet } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <NavigationEvents onDidFocus={this.checkCleanBackupPhrase} />
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <BackupKeyIcon style={styles.logo} width={140} height={102} />
          <Text style={fontStyles.h1}>{t('title')}</Text>
          <Text style={fontStyles.body}>{t('userYourBackupKey')}</Text>
          <BackupPhraseContainer
            onChangeText={this.setBackupPhrase}
            value={backupPhrase}
            testID="ImportWalletBackupKeyInputField"
            mode={BackupPhraseContainerMode.INPUT}
            type={BackupPhraseType.BACKUP_KEY}
            style={componentStyles.marginTop20}
          />
          <Text style={styles.tip}>
            <Text style={fontStyles.semiBold}>{t('tip')}</Text>
            {t('backupKeyTip')}
          </Text>
        </KeyboardAwareScrollView>

        {isImportingWallet && (
          <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        )}

        <GethAwareButton
          disabled={isImportingWallet || !isValidBackupPhrase(backupPhrase)}
          onPress={this.onPressRestore}
          text={t('restoreWallet')}
          standard={false}
          type={BtnTypes.PRIMARY}
          testID="ImportWalletButton"
        />

        <Button
          disabled={isImportingWallet}
          onPress={this.onPressRestoreSocial}
          text={t('restoreSocial')}
          standard={false}
          type={BtnTypes.SECONDARY}
          testID="ImportWalletSocialButton"
        />
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
    padding: 20,
    paddingTop: 0,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  tip: {
    ...fontStyles.bodySmall,
    color: colors.darkSecondary,
    marginTop: 20,
    marginHorizontal: 2,
  },
  loadingSpinnerContainer: {
    marginVertical: 20,
  },
})

export default connect<StateProps, DispatchProps, any, RootState>(mapStateToProps, {
  importBackupPhrase,
  hideAlert,
})(withTranslation(Namespaces.nuxRestoreWallet3)(ImportWallet))
