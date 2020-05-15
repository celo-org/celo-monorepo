import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import Switch from '@celo/react-components/components/Switch.v2'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import * as React from 'react'
import { useTranslation, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import { getStoredMnemonic } from 'src/backup/utils'
import CancelButton from 'src/components/CancelButton.v2'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import TopBarButton from 'src/navigator/TopBarButton.v2'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

interface State {
  mnemonic: string
  isConfirmChecked: boolean
}

interface StateProps {
  backupCompleted: boolean
}

interface DispatchProps {
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
  }
}

class BackupPhrase extends React.Component<Props, State> {
  // TODO(Rossy): Show modal when cancelling if backup flow incomplete
  static navigationOptions = () => ({
    ...headerWithCancelButton,
    headerLeft: <CancelButton color={colors.gray4} />,
    headerTitle: 'Account Key',
    headerRight: <HeaderRight />,
  })
  state = {
    mnemonic: '',
    isConfirmChecked: false,
  }

  async componentDidMount() {
    await this.retrieveMnemonic()
  }

  componentWillUnmount() {
    this.props.hideAlert()
  }

  retrieveMnemonic = async () => {
    if (this.state.mnemonic) {
      return
    }

    try {
      const mnemonic = await getStoredMnemonic()
      if (!mnemonic) {
        throw new Error('Mnemonic not found in key store')
      }
      this.setState({ mnemonic })
    } catch (e) {
      Logger.error('BackupPhrase/retrieveMnemonic', 'Failed to retrieve mnemonic', e)
      this.props.showError(ErrorMessages.FAILED_FETCH_MNEMONIC)
    }
  }

  onPressConfirmSwitch = (value: boolean) => {
    this.setState({
      isConfirmChecked: value,
    })
  }

  onPressConfirmArea = () => {
    this.setState((state) => ({ isConfirmChecked: !state.isConfirmChecked }))
  }

  onPressContinue = () => {
    const { mnemonic } = this.state
    CeloAnalytics.track(CustomEventNames.backup_continue)
    navigate(Screens.BackupQuiz, { mnemonic })
  }

  render() {
    const { t, backupCompleted } = this.props
    const { mnemonic, isConfirmChecked } = this.state
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <BackupPhraseContainer
            value={mnemonic}
            mode={BackupPhraseContainerMode.READONLY}
            type={BackupPhraseType.BACKUP_KEY}
          />
          <Text style={styles.body}>{t('backupKeySummary')}</Text>
        </ScrollView>
        {!backupCompleted && (
          <>
            <View style={styles.confirmationSwitchContainer}>
              <Switch value={isConfirmChecked} onValueChange={this.onPressConfirmSwitch} />
              <Text onPress={this.onPressConfirmArea} style={styles.confirmationSwitchLabel}>
                {t('savedConfirmation')}
              </Text>
            </View>
            <Button
              disabled={!isConfirmChecked}
              onPress={this.onPressContinue}
              text={t('global:continue')}
              size={BtnSizes.FULL}
              type={BtnTypes.SECONDARY}
            />
          </>
        )}
      </SafeAreaView>
    )
  }
}

function HeaderRight() {
  const { t } = useTranslation(Namespaces.backupKeyFlow6)
  return <TopBarButton>{t('moreInfo')}</TopBarButton>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light,
    justifyContent: 'space-between',
    padding: 16,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 16,
  },
  body: {
    ...fontStyles.regular,
    marginTop: 16,
  },
  confirmationSwitchContainer: {
    marginVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  confirmationSwitchLabel: {
    flex: 1,
    ...fontStyles.regular,
    paddingLeft: 8,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, { showError, hideAlert })(
    withTranslation(Namespaces.backupKeyFlow6)(BackupPhrase)
  )
)
