import { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, Keyboard, StyleSheet, Text, View } from 'react-native'
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
  isValidSocialBackupPhrase,
  joinMnemonic,
} from 'src/backup/utils'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces, withTranslation } from 'src/i18n'
import SafeguardsIcon from 'src/icons/SafeguardsIcon'
import { importBackupPhrase } from 'src/import/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'

interface State {
  phrase1: string
  phrase2: string
}

interface DispatchProps {
  importBackupPhrase: typeof importBackupPhrase
  hideAlert: typeof hideAlert
}

interface StateProps {
  isImportingWallet: boolean
}

type Props = StateProps & DispatchProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isImportingWallet: state.imports.isImportingWallet,
  }
}

export class ImportWalletSocial extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state: State = {
    phrase1: '',
    phrase2: '',
  }

  setBackupPhrase = (phraseNum: number) => (input: string) => {
    this.props.hideAlert()
    const formattedInput = formatBackupPhraseOnEdit(input)
    if (phraseNum === 1) {
      this.setState({
        phrase1: formattedInput,
      })
    } else {
      this.setState({
        phrase2: formattedInput,
      })
    }
  }

  onPressRestore = () => {
    const { phrase1, phrase2 } = this.state
    Keyboard.dismiss()
    this.props.hideAlert()
    CeloAnalytics.track(CustomEventNames.import_wallet_submit)

    const formattedPhrase1 = formatBackupPhraseOnSubmit(phrase1)
    const formattedPhrase2 = formatBackupPhraseOnSubmit(phrase2)

    this.setState({
      phrase1: formattedPhrase1,
      phrase2: formattedPhrase2,
    })

    const fullPhrase = joinMnemonic([formattedPhrase1, formattedPhrase2])
    this.props.importBackupPhrase(fullPhrase, false)
  }

  render() {
    const { phrase1, phrase2 } = this.state
    const { t, isImportingWallet } = this.props

    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <SafeguardsIcon style={styles.logo} width={147} height={75} />
          <Text style={fontStyles.h1}>{t('restoreSocial')}</Text>
          <Text style={fontStyles.body}>{t('socialImportInfo')}</Text>
          <BackupPhraseContainer
            onChangeText={this.setBackupPhrase(1)}
            value={phrase1}
            testID="SocialBackupKeyInputField1"
            mode={BackupPhraseContainerMode.INPUT}
            type={BackupPhraseType.SOCIAL_BACKUP}
            index={1}
            style={componentStyles.marginTop20}
          />
          <BackupPhraseContainer
            onChangeText={this.setBackupPhrase(2)}
            value={phrase2}
            testID="SocialBackupKeyInputField2"
            mode={BackupPhraseContainerMode.INPUT}
            type={BackupPhraseType.SOCIAL_BACKUP}
            index={2}
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
          disabled={
            isImportingWallet ||
            !isValidSocialBackupPhrase(phrase1) ||
            !isValidSocialBackupPhrase(phrase2)
          }
          onPress={this.onPressRestore}
          text={t('restoreWallet')}
          standard={false}
          type={BtnTypes.PRIMARY}
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

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  importBackupPhrase,
  hideAlert,
})(withTranslation(Namespaces.nuxRestoreWallet3)(ImportWalletSocial))
