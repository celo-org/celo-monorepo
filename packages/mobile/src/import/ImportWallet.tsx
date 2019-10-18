import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ActivityIndicator, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import GethAwareButton from 'src/geth/GethAwareButton'
import { Namespaces } from 'src/i18n'
import NuxLogo from 'src/icons/NuxLogo'
import { importBackupPhrase, tryAnotherBackupPhrase } from 'src/import/actions'
import { nuxNavigationOptions } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'
import { getMoneyDisplayValue } from 'src/utils/formatting'

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

export class ImportWallet extends React.Component<Props, State> {
  static navigationOptions = nuxNavigationOptions

  state = {
    backupPhrase: '',
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

  onPressUseEmpty = () => {
    this.props.importBackupPhrase(this.state.backupPhrase, true)
  }

  onPressTryAnotherKey = () => {
    this.props.tryAnotherBackupPhrase()
  }

  isBackupPhraseValid() {
    return (
      formatBackupPhraseOnEdit(this.state.backupPhrase)
        .trim()
        .split(/\s+/g).length >= 12
    )
  }

  render() {
    const { backupPhrase } = this.state
    const { t, isImportingWallet, isWalletEmpty } = this.props

    return (
      <SafeAreaView style={styles.container}>
        {!isWalletEmpty && (
          <>
            <KeyboardAwareScrollView
              contentContainerStyle={styles.scrollContainer}
              keyboardShouldPersistTaps="always"
            >
              <NuxLogo />
              <Text style={fontStyles.h1}>{t('title')}</Text>
              <Text style={fontStyles.body}>{t('userYourBackupKey')}</Text>
              <View style={styles.backupInput}>
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
              disabled={isImportingWallet || !this.isBackupPhraseValid()}
              onPress={this.onPressRestore}
              text={t('restoreWallet')}
              standard={false}
              type={BtnTypes.PRIMARY}
              testID="ImportWalletButton"
            />
          </>
        )}
        {isWalletEmpty && ( // TODO use backup icon instead of Nuxlogo when we have one
          <>
            <View style={styles.emptyWarningContainer}>
              <NuxLogo />
              <Text style={fontStyles.h1}>{getMoneyDisplayValue(0)}</Text>
              <Text style={fontStyles.bodyLarge}>{t('emptyWalletWarning')}</Text>
              <Text style={fontStyles.bodyLarge}>{t('useEmptyAnyway')}</Text>
            </View>
            <GethAwareButton
              onPress={this.onPressUseEmpty}
              text={t('useEmptyWallet')}
              standard={false}
              type={BtnTypes.PRIMARY}
              testID="UseEmptyWalletButton"
            />
            <Button
              onPress={this.onPressTryAnotherKey}
              text={t('tryAnotherKey')}
              standard={false}
              type={BtnTypes.SECONDARY}
              testID="TryAnotherKeyButton"
            />
          </>
        )}
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
  tip: {
    ...fontStyles.bodyXSmall,
    marginTop: 20,
    marginHorizontal: 2,
  },
  backupInput: {
    borderWidth: 1,
    borderColor: colors.inactive,
    borderRadius: 3,
    marginTop: 20,
    height: 145,
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
)(withNamespaces(Namespaces.nuxRestoreWallet3)(ImportWallet))
