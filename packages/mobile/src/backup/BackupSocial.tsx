import Button, { BtnTypes } from '@celo/react-components/components/Button'
import Switch from '@celo/react-components/components/Switch'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { setSocialBackupCompleted } from 'src/account/actions'
import { showError } from 'src/alert/actions'
import { currentLanguageSelector } from 'src/app/reducers'
import BackupPhraseContainer, {
  BackupPhraseContainerMode,
  BackupPhraseType,
} from 'src/backup/BackupPhraseContainer'
import { getStoredMnemonic, onGetMnemonicFail, splitMnemonic } from 'src/backup/utils'
import { Namespaces, withTranslation } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { currentAccountSelector } from 'src/web3/selectors'

interface State {
  mnemonic: string
  mnemonicParts: string[]
  isConfirmChecked: boolean
}

interface StateProps {
  account: string | null
  socialBackupCompleted: boolean
  language: string | null
}

interface DispatchProps {
  setSocialBackupCompleted: typeof setSocialBackupCompleted
  showError: typeof showError
}

type Props = WithTranslation & StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    account: currentAccountSelector(state),
    language: currentLanguageSelector(state),
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
    const mnemonic = await getStoredMnemonic(this.props.account)

    if (mnemonic) {
      this.setState({ mnemonic, mnemonicParts: splitMnemonic(mnemonic, this.props.language) })
    } else {
      onGetMnemonicFail(this.props.showError, 'BackupSocial')
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
              <Switch value={isConfirmChecked} onValueChange={this.onPressConfirmSwitch} />
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

export default connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
  setSocialBackupCompleted,
  showError,
})(withTranslation<Props>(Namespaces.backupKeyFlow6)(BackupSocial))
