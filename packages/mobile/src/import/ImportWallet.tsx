import { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native'
import { validateMnemonic } from 'react-native-bip39'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { importBackupPhrase } from 'src/import/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

const TAG = 'ImportWallet'

// Because of a RN bug, we can't fully clean the text as the user types
// https://github.com/facebook/react-native/issues/11068
export const formatBackupPhraseOnEdit = (phrase: string) => phrase.replace(/\s+/gm, ' ')
// Note(Ashish) The wordlists seem to use NFD and contains lower-case words for English and Spanish.
// I am not sure if the words are lower-case for Japanese as well but I am assuming that for now.
export const formatBackupPhraseOnSubmit = (phrase: string) =>
  formatBackupPhraseOnEdit(phrase)
    .trim()
    .normalize('NFD')
    .toLocaleLowerCase()

interface State {
  backupPhrase: string
  isSubmitting: boolean
}

interface DispatchProps {
  importBackupPhrase: typeof importBackupPhrase
  showError: typeof showError
  hideAlert: typeof hideAlert
}

interface StateProps {
  error: ErrorMessages | null
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    error: errorSelector(state),
  }
}

const displayedErrors = [ErrorMessages.INVALID_BACKUP, ErrorMessages.IMPORT_BACKUP_FAILED]

const hasDisplayedError = (error: ErrorMessages | null) => {
  return error && displayedErrors.includes(error)
}

export class ImportWallet extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    if (hasDisplayedError(props.error) && state.isSubmitting) {
      return {
        ...state,
        isSubmitting: false,
      }
    }
    return null
  }

  state = {
    backupPhrase: '',
    isSubmitting: false,
  }

  setBackupPhrase = (input: string) => {
    this.props.hideAlert()
    this.setState({
      backupPhrase: formatBackupPhraseOnEdit(input),
    })
  }

  onEndEditing = () => {
    CeloAnalytics.track(CustomEventNames.import_phrase_input)
  }

  onSubmit = () => {
    try {
      this.setState({
        isSubmitting: true,
      })

      Keyboard.dismiss()
      this.props.hideAlert()
      CeloAnalytics.track(CustomEventNames.import_wallet_submit)

      const formattedPhrase = formatBackupPhraseOnSubmit(this.state.backupPhrase)
      this.setState({
        backupPhrase: formattedPhrase,
      })

      if (!validateMnemonic(formattedPhrase)) {
        Logger.warn(TAG, 'Invalid mnemonic')
        this.props.showError(ErrorMessages.INVALID_BACKUP)
        this.setState({
          isSubmitting: false,
        })
        return
      }

      this.props.importBackupPhrase(formattedPhrase)
    } catch (error) {
      this.setState({
        isSubmitting: false,
      })
      Logger.error(TAG, 'Error importing wallet', error)
      this.props.showError(ErrorMessages.IMPORT_BACKUP_FAILED)
    }
  }

  isBackupPhraseValid() {
    return this.state.backupPhrase.trim().split(/\s+/g).length >= 12
  }

  render() {
    const { backupPhrase, isSubmitting } = this.state
    const { t, error } = this.props

    return (
      <View style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <NuxLogo />
          <Text style={[fontStyles.h1, styles.h1]}>{t('restoreYourWallet.title')}</Text>
          <Text style={[fontStyles.bodySmall, styles.body]}>
            {t('restoreYourWallet.userYourBackupKey')}
          </Text>
          <Text style={[fontStyles.bodySmall, styles.body]}>{t('backupKeyTip')}</Text>
          <Text style={[fontStyles.bodySmall, styles.body]}>
            <Text style={[styles.warning, fontStyles.medium]}>
              {t('restoreYourWallet.warning')}
            </Text>
            {t('restoreYourWallet.restoreInPrivate')}
          </Text>
          <View
            style={[
              componentStyles.row,
              styles.backupInput,
              hasDisplayedError(error) && styles.inputError,
            ]}
          >
            <TextInput
              onChangeText={this.setBackupPhrase}
              onEndEditing={this.onEndEditing}
              value={backupPhrase}
              style={componentStyles.input}
              underlineColorAndroid="transparent"
              placeholder={t('backupKeyPrompt')}
              placeholderTextColor={colors.inactive}
              enablesReturnKeyAutomatically={true}
              multiline={true}
              autoCorrect={false}
              autoCapitalize={'none'}
              testID="ImportWalletBackupKeyInputField"
            />
          </View>
        </KeyboardAwareScrollView>
        {isSubmitting && (
          <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        )}
        <GethAwareButton
          disabled={isSubmitting || !this.isBackupPhraseValid()}
          onPress={this.onSubmit}
          text={t('restoreWallet')}
          standard={false}
          type={BtnTypes.PRIMARY}
          testID="ImportWalletButton"
        />
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
  cancel: {
    alignItems: 'flex-start',
  },
  scrollContainer: {
    padding: 20,
    paddingTop: 0,
  },
  h1: {
    textAlign: 'center',
    color: colors.dark,
  },
  body: {
    paddingBottom: 15,
  },
  warning: {
    color: colors.errorRed,
  },
  backupInput: {
    height: 124,
  },
  loadingSpinnerContainer: {
    marginVertical: 30,
  },
  inputError: {
    borderColor: colors.errorRed,
  },
})

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  {
    importBackupPhrase,
    showError,
    hideAlert,
  }
)(withNamespaces(Namespaces.nuxRestoreWallet3)(ImportWallet))
