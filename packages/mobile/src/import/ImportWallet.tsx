import Button, { BtnTypes } from '@celo/react-components/components/Button.v2'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import { HeaderHeightContext, StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Keyboard, StyleSheet, Text, View } from 'react-native'
import { SafeAreaInsetsContext } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { hideAlert } from 'src/alert/actions'
import { OnboardingEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import {
  formatBackupPhraseOnEdit,
  formatBackupPhraseOnSubmit,
  isValidBackupPhrase,
} from 'src/backup/utils'
import CodeInput, { CodeInputStatus } from 'src/components/CodeInput'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import Dialog from 'src/components/Dialog'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { importBackupPhrase } from 'src/import/actions'
import { HeaderTitleWithSubtitle, nuxNavigationOptions } from 'src/navigator/Headers.v2'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'

interface State {
  keyboardVisible: boolean
  backupPhrase: string
}

interface DispatchProps {
  importBackupPhrase: typeof importBackupPhrase
  hideAlert: typeof hideAlert
}

interface StateProps {
  isImportingWallet: boolean
  connected: boolean
}

type OwnProps = StackScreenProps<StackParamList, Screens.ImportWallet>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    isImportingWallet: state.imports.isImportingWallet,
    connected: isAppConnected(state),
  }
}

export class ImportWallet extends React.Component<Props, State> {
  static navigationOptions = {
    ...nuxNavigationOptions,
    headerTitle: () => (
      <HeaderTitleWithSubtitle
        title={i18n.t('nuxNamePin1:importIt')}
        subTitle={i18n.t('onboarding:step', { step: '3' })}
      />
    ),
  }

  state = {
    backupPhrase: '',
    keyboardVisible: false,
  }
  componentDidMount() {
    ValoraAnalytics.track(OnboardingEvents.wallet_import_start)
    this.props.navigation.addListener('focus', this.checkCleanBackupPhrase)
  }

  componentWillUnmount() {
    this.props.navigation.removeListener('focus', this.checkCleanBackupPhrase)
  }

  checkCleanBackupPhrase = () => {
    const { route, navigation } = this.props
    if (route.params?.clean) {
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

  onToggleKeyboard = (visible: boolean) => {
    this.setState({ keyboardVisible: visible })
  }

  onPressRestore = () => {
    const { route, navigation } = this.props
    const useEmptyWallet = !!route.params?.showZeroBalanceModal
    Keyboard.dismiss()
    this.props.hideAlert()
    ValoraAnalytics.track(OnboardingEvents.wallet_import_complete)

    const formattedPhrase = formatBackupPhraseOnSubmit(this.state.backupPhrase)
    this.setState({
      backupPhrase: formattedPhrase,
    })
    navigation.setParams({ showZeroBalanceModal: false })

    this.props.importBackupPhrase(formattedPhrase, useEmptyWallet)
  }

  shouldShowClipboard = (clipboardContent: string): boolean => {
    return isValidBackupPhrase(clipboardContent)
  }

  onPressTryAnotherKey = () => {
    const { navigation } = this.props
    this.setState({
      backupPhrase: '',
    })
    ValoraAnalytics.track(OnboardingEvents.wallet_import_cancel)
    navigation.setParams({ clean: false, showZeroBalanceModal: false })
  }

  render() {
    const { backupPhrase, keyboardVisible } = this.state
    const { t, isImportingWallet, connected, route } = this.props

    let codeStatus = CodeInputStatus.INPUTTING
    if (isImportingWallet) {
      codeStatus = CodeInputStatus.PROCESSING
    }
    return (
      <HeaderHeightContext.Consumer>
        {(headerHeight) => (
          <SafeAreaInsetsContext.Consumer>
            {(insets) => (
              <View style={styles.container}>
                <DisconnectBanner />
                <KeyboardAwareScrollView
                  style={headerHeight ? { marginTop: headerHeight } : undefined}
                  contentContainerStyle={[
                    styles.scrollContainer,
                    !keyboardVisible && insets && { marginBottom: insets.bottom },
                  ]}
                  keyboardShouldPersistTaps={'always'}
                >
                  <CodeInput
                    label={t('global:accountKey')}
                    status={codeStatus}
                    inputValue={backupPhrase}
                    inputPlaceholder={t('importExistingKey.keyPlaceholder')}
                    multiline={true}
                    onInputChange={this.setBackupPhrase}
                    shouldShowClipboard={this.shouldShowClipboard}
                    testID="ImportWalletBackupKeyInputField"
                  />
                  <Text style={styles.explanation}>{t('importExistingKey.explanation')}</Text>
                  <Button
                    style={styles.button}
                    testID="ImportWalletButton"
                    onPress={this.onPressRestore}
                    text={t('global:restore')}
                    type={BtnTypes.ONBOARDING}
                    disabled={isImportingWallet || !isValidBackupPhrase(backupPhrase) || !connected}
                  />

                  <KeyboardSpacer />
                </KeyboardAwareScrollView>
                <KeyboardSpacer onToggle={this.onToggleKeyboard} />
                <Dialog
                  title={
                    <Trans i18nKey="emptyAccount.title" ns={Namespaces.onboarding}>
                      <CurrencyDisplay
                        amount={{
                          value: new BigNumber(0),
                          currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                        }}
                      />
                    </Trans>
                  }
                  isVisible={!!route.params?.showZeroBalanceModal}
                  actionText={t('emptyAccount.useAccount')}
                  actionPress={this.onPressRestore}
                  secondaryActionPress={this.onPressTryAnotherKey}
                  secondaryActionText={t('global:goBack')}
                >
                  {t('emptyAccount.description')}
                </Dialog>
              </View>
            )}
          </SafeAreaInsetsContext.Consumer>
        )}
      </HeaderHeightContext.Consumer>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  scrollContainer: {
    padding: 16,
  },
  logo: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  loadingSpinnerContainer: {
    marginVertical: 20,
  },
  button: {
    paddingVertical: 16,
  },
  wordsInput: {
    minHeight: 80,
  },
  explanation: {
    ...fontStyles.regular,
    paddingHorizontal: 8,
    paddingTop: 16,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
  importBackupPhrase,
  hideAlert,
})(withTranslation<Props>(Namespaces.onboarding)(ImportWallet))
