import Button, { BtnTypes } from '@celo/react-components/components/Button'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { Clipboard, StyleSheet, Text, View } from 'react-native'
import FlagSecure from 'react-native-flag-secure-android'
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackupPhraseContainer from 'src/backup/BackupPhraseContainer'
import { getStoredMnemonic } from 'src/backup/utils'
import { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

interface State {
  mnemonic: string
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
  // TODO(Derrick): Show cancel if backup flow incomplete
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  state = {
    mnemonic: '',
  }

  componentDidMount() {
    FlagSecure.activate()
    this.retrieveMnemonic()
  }

  componentWillUnmount() {
    FlagSecure.deactivate()
    this.props.hideAlert()
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
      this.setState({ mnemonic })
    } catch (e) {
      Logger.error('backup/retrieveMnemonic', e)
      this.props.showError(ErrorMessages.FAILED_FETCH_MNEMONIC)
    }
  }

  continueBackup = () => {
    const { t } = this.props
    CeloAnalytics.track(CustomEventNames.backup_continue)
    // Clear clipboard so that users won't just copy here and paste it directly
    // in the verification step.  Hopefully makes users paste it somewhere else at least.
    Clipboard.setString('')
    Logger.showMessage(t('clipboardCleared'))
    navigate(Screens.BackupQuiz)
  }

  render() {
    const { t, backupCompleted } = this.props
    const { mnemonic } = this.state
    return (
      <View style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="always"
        >
          <View>
            <Text style={[fontStyles.h1, styles.title]}>{t('yourBackupKey')}</Text>
            {!backupCompleted ? (
              <Text style={styles.verifyText}>{t('backupKeySummary.0')}</Text>
            ) : (
              <Text style={styles.verifyText}>{t('heresYourKey')}</Text>
            )}
            <BackupPhraseContainer words={mnemonic} showCopy={true} />
            <Text style={styles.verifyText}>
              <Text style={[styles.verifyText, fontStyles.bold]}>{t('tip')}</Text>
              {t('securityTip')}
            </Text>
          </View>
        </KeyboardAwareScrollView>
        <View>
          {!backupCompleted && (
            <Button
              onPress={this.continueBackup}
              text={t('continue')}
              standard={false}
              type={BtnTypes.PRIMARY}
            />
          )}
        </View>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  title: {
    paddingBottom: 10,
    color: colors.dark,
  },
  body: {
    paddingBottom: 15,
    color: colors.dark,
  },
  phraseContainer: {
    position: 'relative',
    backgroundColor: colors.altDarkBg,
    alignContent: 'center',
    justifyContent: 'center',
    padding: 16,
    marginTop: 30,
  },
  phraseText: {
    ...fontStyles.h2,
    textAlign: 'left',
  },
  verifyText: {
    ...fontStyles.bodySmall,
    fontSize: 15,
    textAlign: 'left',
    paddingTop: 15,
  },
  buttonSpacing: {
    marginTop: 20,
    marginLeft: 5,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { showError, hideAlert }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupPhrase))
)
