import { BtnTypes } from '@celo/react-components/components/Button'
import Link from '@celo/react-components/components/Link'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native'
import { validateMnemonic } from 'react-native-bip39'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { AndroidBackHandler } from 'react-navigation-backhandler'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { joinMnemonic } from 'src/backup/utils'
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
  socialBackupPhrase0: string
  socialBackupPhrase1: string
  isSubmitting: boolean
  isSocial: boolean
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
    socialBackupPhrase0: '',
    socialBackupPhrase1: '',
    isSubmitting: false,
    isSocial: false,
  }

  onBackButtonPressAndroid = () => {
    // Override back button to not go back to BackupVerify screen
    if (this.state.isSocial) {
      this.setState({ isSocial: false })
      return true
    }

    return false
  }

  useSocial = () => {
    this.setState({ isSocial: true })
  }

  setBackupPhrase = async (input: string) => {
    this.props.hideAlert()

    this.setState({ backupPhrase: formatBackupPhraseOnEdit(input) })
  }

  setSocialBackupPhrase0 = (input: string) => {
    const { socialBackupPhrase1 } = this.state

    if (input && socialBackupPhrase1) {
      this.setState({
        socialBackupPhrase0: input,
        backupPhrase: joinMnemonic([input, socialBackupPhrase1]),
      })
    } else {
      this.setState({ socialBackupPhrase0: input })
    }
  }

  setSocialBackupPhrase1 = (input: string) => {
    const { socialBackupPhrase0 } = this.state

    if (input && socialBackupPhrase0) {
      this.setState({
        socialBackupPhrase1: input,
        backupPhrase: joinMnemonic([socialBackupPhrase0, input]),
      })
    } else {
      this.setState({ socialBackupPhrase1: input })
    }
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

  render() {
    const {
      backupPhrase,
      socialBackupPhrase0,
      socialBackupPhrase1,
      isSubmitting,
      isSocial,
    } = this.state
    const { t, error } = this.props

    const restoreButtonDisabled = isSocial
      ? !socialBackupPhrase0 || !socialBackupPhrase1
      : !backupPhrase

    return (
      <View style={styles.container}>
        <AndroidBackHandler onBackPress={this.onBackButtonPressAndroid} />
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <NuxLogo />
          <Text style={[fontStyles.h1, styles.h1]}>
            {t(!isSocial ? 'restoreYourWallet.title' : 'restoreYourWallet.socialTitle')}
          </Text>
          <Text style={[fontStyles.bodySmall, styles.body]}>
            {t(!isSocial ? 'restoreYourWallet.description' : 'restoreYourWallet.socialDescription')}
          </Text>
          <Text style={[fontStyles.bodySmall, styles.body]}>
            <Text style={[styles.warning, fontStyles.medium]}>
              {t('restoreYourWallet.warning')}
            </Text>
            {t('restoreYourWallet.restoreInPrivate')}
          </Text>
          {!isSocial ? (
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
                autoCapitalize="none"
                testID="ImportWalletBackupKeyInputField"
              />
            </View>
          ) : (
            <>
              <View
                style={[
                  componentStyles.row,
                  styles.socialBackupInput,
                  hasDisplayedError(error) && styles.inputError,
                ]}
              >
                <TextInput
                  onChangeText={this.setSocialBackupPhrase0}
                  onEndEditing={this.onEndEditing}
                  value={socialBackupPhrase0}
                  style={componentStyles.input}
                  underlineColorAndroid="transparent"
                  placeholder={t('backupKeyPromptHalfFirst')}
                  placeholderTextColor={colors.inactive}
                  enablesReturnKeyAutomatically={true}
                  multiline={true}
                  autoCorrect={false}
                  autoCapitalize="none"
                  testID="ImportWalletSocialBackupKeyFirstInputField"
                />
              </View>
              <View
                style={[
                  componentStyles.row,
                  styles.socialBackupInput,
                  hasDisplayedError(error) && styles.inputError,
                ]}
              >
                <TextInput
                  onChangeText={this.setSocialBackupPhrase1}
                  onEndEditing={this.onEndEditing}
                  value={socialBackupPhrase1}
                  style={componentStyles.input}
                  underlineColorAndroid="transparent"
                  placeholder={t('backupKeyPromptHalfSecond')}
                  placeholderTextColor={colors.inactive}
                  enablesReturnKeyAutomatically={true}
                  multiline={true}
                  autoCorrect={false}
                  autoCapitalize="none"
                  testID="ImportWalletSocialBackupKeySecondInputField"
                />
              </View>
            </>
          )}
          <Text style={[fontStyles.bodySmall, styles.body]}>
            <Text style={[fontStyles.bold]}>{t('tip')}</Text>
            {t(!isSocial ? 'backupKeyTip' : 'socialBackupKeyTip')}
          </Text>
        </KeyboardAwareScrollView>
        {isSubmitting && (
          <View style={styles.loadingSpinnerContainer} testID="ImportWalletLoadingCircle">
            <ActivityIndicator size="large" color={colors.celoGreen} />
          </View>
        )}
        <GethAwareButton
          disabled={isSubmitting || restoreButtonDisabled}
          onPress={this.onSubmit}
          text={t('restoreWallet')}
          standard={false}
          type={BtnTypes.PRIMARY}
          testID="ImportWalletButton"
        />
        <View style={styles.lostKeyContainer}>
          {!isSocial ? (
            <>
              <Text style={fontStyles.bodySmall}>{t('lostYourKey.0')} </Text>
              <Link onPress={this.useSocial}>{t('lostYourKey.1')}</Link>
            </>
          ) : (
            <>
              <Text style={fontStyles.bodySmall}>{t('noPhrases.0')} </Text>
              <Link onPress={this.useSocial}>{t('noPhrases.1')}</Link>
            </>
          )}
        </View>
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
  lostKeyContainer: {
    flexDirection: 'row',
    marginTop: 5,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  socialBackupInput: {
    height: 62,
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
