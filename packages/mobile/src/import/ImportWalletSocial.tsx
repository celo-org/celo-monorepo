import { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ActivityIndicator, Image, Keyboard, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
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
  isBackupPhraseValid,
} from 'src/backup/utils'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import { backupIcon } from 'src/images/Images'
import { importBackupPhrase, tryAnotherBackupPhrase } from 'src/import/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'

interface State {
  phrase1: string
  phrase2: string
}

interface DispatchProps {
  importBackupPhrase: typeof importBackupPhrase
  tryAnotherBackupPhrase: typeof tryAnotherBackupPhrase
  hideAlert: typeof hideAlert
}

interface StateProps {
  isImportingWallet: boolean
  isWalletEmpty: boolean
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isImportingWallet: state.imports.isImportingWallet,
    isWalletEmpty: state.imports.isWalletEmpty,
  }
}

export class ImportWalletSocial extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state: State = {
    phrase1: '',
    phrase2: '',
  }

  setBackupPhrase = (input: string) => {
    this.props.hideAlert()
    this.setState({
      phrase1: formatBackupPhraseOnEdit(input),
    })
  }

  onPressRestore = () => {
    Keyboard.dismiss()
    this.props.hideAlert()
    CeloAnalytics.track(CustomEventNames.import_wallet_submit)

    const formattedPhrase = formatBackupPhraseOnSubmit(this.state.phrase1)
    this.setState({
      phrase1: formattedPhrase,
    })

    this.props.importBackupPhrase(formattedPhrase, false)
  }

  render() {
    const { phrase1 } = this.state
    const { t, isImportingWallet } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <>
          <KeyboardAwareScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="always"
          >
            <Image source={backupIcon} style={styles.logo} />
            <Text style={fontStyles.h1}>{t('socialImportTitle')}</Text>
            <Text style={fontStyles.body}>{t('socialImportInfo')}</Text>
            <BackupPhraseContainer
              onChangeText={this.setBackupPhrase}
              value={phrase1}
              testID="ImportWalletBackupKeyInputField"
              mode={BackupPhraseContainerMode.INPUT}
              type={BackupPhraseType.SOCIAL_BACKUP}
              style={componentStyles.marginTop20}
            />
            <BackupPhraseContainer
              onChangeText={this.setBackupPhrase}
              value={phrase1}
              testID="ImportWalletBackupKeyInputField"
              mode={BackupPhraseContainerMode.INPUT}
              type={BackupPhraseType.SOCIAL_BACKUP}
              style={componentStyles.marginTop20}
            />
            <Text style={styles.tip}>
              <Text style={fontStyles.semiBold}>{t('tip')}</Text>
              {t('socialTip')}
            </Text>
          </KeyboardAwareScrollView>

          {isImportingWallet && (
            <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
              <ActivityIndicator size="large" color={colors.celoGreen} />
            </View>
          )}

          <GethAwareButton
            disabled={isImportingWallet || !isBackupPhraseValid(phrase1)}
            onPress={this.onPressRestore}
            text={t('restoreWallet')}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="ImportWalletButton"
          />
        </>
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
    height: 75,
    width: 75,
  },
  tip: {
    ...fontStyles.bodySmall,
    color: colors.darkSecondary,
    marginTop: 20,
    marginHorizontal: 2,
  },
  emptyWarningContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    paddingHorizontal: 30,
    paddingBottom: 30,
  },
  loadingSpinnerContainer: {
    marginVertical: 30,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  {
    importBackupPhrase,
    tryAnotherBackupPhrase,
    hideAlert,
  }
)(withNamespaces(Namespaces.nuxRestoreWallet3)(ImportWalletSocial))
