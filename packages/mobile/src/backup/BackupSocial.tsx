import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Switch, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { setSocialBackupCompleted } from 'src/account'
import { showError } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import { getStoredMnemonic, splitMnemonic } from 'src/backup/utils'
import { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

interface State {
  mnemonic: string
  mnemonicParts: string[]
  isConfirmChecked: boolean
}

interface StateProps {
  socialBackupCompleted: boolean
  language: string | null
}

interface DispatchProps {
  setSocialBackupCompleted: typeof setSocialBackupCompleted
  showError: typeof showError
}

type Props = WithNamespaces & StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language,
    socialBackupCompleted: state.account.socialBackupCompleted,
  }
}

class BackupSocial extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  state: State = {
    mnemonic: '',
    mnemonicParts: [],
    isConfirmChecked: false,
  }

  async componentDidMount() {
    await this.retrieveMnemonic()
  }

  retrieveMnemonic = async () => {
    if (this.state.mnemonic) {
      return
    }

    try {
      const mnemonic = await getStoredMnemonic()
      if (!mnemonic) {
        throw new Error('Mnemonic not stored in key store')
      }
      this.setState({ mnemonic, mnemonicParts: splitMnemonic(mnemonic, this.props.language) })
    } catch (e) {
      Logger.error('BackupSocial/retrieveMnemonic', e)
      this.props.showError(ErrorMessages.FAILED_FETCH_MNEMONIC)
    }
  }

  onPressConfirmSwitch = (value: boolean) => {
    this.setState({
      isConfirmChecked: value,
    })
  }

  onPressDone = () => {
    this.props.setSocialBackupCompleted()
    navigate(Screens.BackupComplete)
  }

  render() {
    const { t, socialBackupCompleted } = this.props
    const {
      mnemonicParts: [firstHalf, secondHalf],
      isConfirmChecked,
    } = this.state

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View>
            {!socialBackupCompleted && (
              <>
                <Text style={fontStyles.h1}>{t('setUpSocialBackup')}</Text>
                <Text style={styles.bodyText}>{t('socialBackup.body')}</Text>
              </>
            )}
            {socialBackupCompleted && (
              <>
                <Text style={fontStyles.h1}>{t('socialBackup.yourSafeguards')}</Text>
                <Text style={styles.bodyText}>{t('socialBackupIntro.body')}</Text>
              </>
            )}
            <BackupPhraseContainer
              value={firstHalf}
              showCopy={true}
              mode={BackupPhraseContainerMode.READONLY}
              type={BackupPhraseType.SOCIAL_BACKUP}
            />
            <BackupPhraseContainer
              value={secondHalf}
              showCopy={true}
              mode={BackupPhraseContainerMode.READONLY}
              type={BackupPhraseType.SOCIAL_BACKUP}
              style={componentStyles.marginTop20}
            />
          </View>
          {!socialBackupCompleted && (
            <View style={styles.confirmationSwitchContainer}>
              <Switch
                value={isConfirmChecked}
                onValueChange={this.onPressConfirmSwitch}
                trackColor={switchTrackColors}
                thumbColor={colors.celoGreen}
              />
              <Text style={styles.confirmationSwitchLabel}>{t('socialBackup.confirmation')}</Text>
            </View>
          )}
        </ScrollView>
        {!socialBackupCompleted && (
          <Button
            disabled={!isConfirmChecked}
            onPress={this.onPressDone}
            text={t('global:done')}
            standard={false}
            type={BtnTypes.PRIMARY}
          />
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
  bodyText: {
    ...fontStyles.body,
    marginBottom: 20,
  },
  confirmationSwitchContainer: {
    paddingVertical: 20,
    flexDirection: 'row',
  },
  confirmationSwitchLabel: {
    ...fontStyles.body,
    ...fontStyles.semiBold,
    paddingTop: 5,
    paddingLeft: 8,
    paddingRight: 5,
  },
})

const switchTrackColors = {
  false: colors.inactive,
  true: colors.celoGreen,
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      setSocialBackupCompleted,
      showError,
    }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupSocial))
)
