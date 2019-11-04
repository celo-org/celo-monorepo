import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
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
import { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
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

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => {
  return {
    backupCompleted: state.account.backupCompleted,
  }
}

class BackupPhrase extends React.Component<Props, State> {
  // TODO(Rossy): Show modal when cancelling if backup flow incomplete
  static navigationOptions = () => ({
    ...headerWithBackButton,
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
          <View>
            <Text style={fontStyles.h1}>{t('yourBackupKey')}</Text>
            <Text style={styles.body}>{t('backupKeySummary')}</Text>
            <BackupPhraseContainer
              value={mnemonic}
              showCopy={true}
              mode={BackupPhraseContainerMode.READONLY}
              type={BackupPhraseType.BACKUP_KEY}
            />
            <Text style={styles.tipText}>
              <Text style={[styles.tipText, fontStyles.bold]}>{t('global:warning')}</Text>
              {t('securityTip')}
            </Text>
          </View>
        </ScrollView>
        {!backupCompleted && (
          <View>
            <View style={styles.confirmationSwitchContainer}>
              <Switch
                value={isConfirmChecked}
                onValueChange={this.onPressConfirmSwitch}
                trackColor={switchTrackColors}
                thumbColor={colors.celoGreen}
              />
              <Text style={styles.confirmationSwitchLabel}>{t('savedConfirmation')}</Text>
            </View>
            <Button
              disabled={!isConfirmChecked}
              onPress={this.onPressContinue}
              text={t('global:continue')}
              standard={false}
              type={BtnTypes.PRIMARY}
            />
          </View>
        )}
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
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  body: {
    ...fontStyles.body,
    marginBottom: 20,
  },
  tipText: {
    ...fontStyles.bodySmall,
    color: colors.darkSecondary,
    marginTop: 25,
    marginHorizontal: 3,
  },
  confirmationSwitchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: 'row',
  },
  confirmationSwitchLabel: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    paddingTop: 3,
    paddingLeft: 10,
  },
})

const switchTrackColors = {
  false: colors.inactive,
  true: colors.celoGreen,
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { showError, hideAlert }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupPhrase))
)
