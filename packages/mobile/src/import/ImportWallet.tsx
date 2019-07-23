import { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ActivityIndicator, StyleSheet, Text, TextInput, View } from 'react-native'
import { validateMnemonic } from 'react-native-bip39'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CancelButton from 'src/components/CancelButton'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { importBackupPhrase } from 'src/import/actions'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import Logger from 'src/utils/Logger'

const TAG = 'ImportWallet'

// Because of a RN bug, we can't fully clean the text as the user types
// https://github.com/facebook/react-native/issues/11068
export const formatBackupPhraseOnEdit = (phrase: string) => phrase.replace(/\s+/gm, ' ')
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
  const { alert } = state
  return {
    error: (alert && alert.underlyingError) || null,
  }
}

const displayedErrors = [ErrorMessages.INVALID_BACKUP, ErrorMessages.IMPORT_BACKUP_FAILED]

const hasDisplayedError = (error: ErrorMessages | null) => {
  return error && displayedErrors.includes(error)
}

export class ImportWallet extends React.Component<Props, State> {
  static navigationOptions = { header: null }

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
    // Note(Ashish) The wordlists seem to use NFD and contains lower-case words for English and Spanish.
    // I am not sure if the words are lower-case for Japanese as well but I am assuming that for now.
    this.props.hideAlert()
    CeloAnalytics.track(CustomEventNames.import_wallet_submit)

    const formattedPhrase = formatBackupPhraseOnSubmit(this.state.backupPhrase)
    this.setState({
      isSubmitting: true,
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
  }

  render() {
    const { backupPhrase, isSubmitting } = this.state
    const { t, error } = this.props

    return (
      <View style={styles.container}>
        <View style={componentStyles.topBar}>
          <View style={styles.cancel}>
            <CancelButton eventName={CustomEventNames.import_wallet_cancel} />
          </View>
        </View>
        <KeyboardAwareScrollView
          // @ts-ignore
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <DisconnectBanner />
          <NuxLogo />
          <Text style={[fontStyles.h1, styles.h1]}>{t('restoreYourWallet.title')}</Text>
          <Text style={[fontStyles.body, styles.body]}>
            {t('restoreYourWallet.userYourBackupKey')}
          </Text>
          <Text style={[fontStyles.body, styles.body]}>
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
          <Text style={fontStyles.bodySmall}>
            <Text style={fontStyles.medium}>{t('tip')}</Text>
            {t('backupKeyTip')}
          </Text>
        </KeyboardAwareScrollView>
        {isSubmitting ? (
          <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        ) : (
          <GethAwareButton
            disabled={isSubmitting || !this.state.backupPhrase}
            onPress={this.onSubmit}
            text={t('restoreWallet')}
            standard={false}
            type={BtnTypes.PRIMARY}
            testID="ImportWalletButton"
          />
        )}
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
    paddingHorizontal: 10,
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
    marginVertical: 10,
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
