import colors from '@celo/react-components/styles/colors'
import fontStyles from '@celo/react-components/styles/fonts'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { ScrollView, StyleSheet, Text } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { setBackupCompleted } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import BackupPhraseContainer from 'src/backup/BackupPhraseContainer'
import { Namespaces } from 'src/i18n'
import { headerWithBackButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'

interface StateProps {
  language: string | null
}

interface State {
  allMnemonicWords: string[]
  userSelectedWords: string[]
}

interface DispatchProps {
  setBackupCompleted: typeof setBackupCompleted
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = WithNamespaces & StateProps & DispatchProps & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language,
  }
}

export class BackupQuiz extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
  })

  state = {
    allMnemonicWords: [],
    userSelectedWords: [],
  }

  componentDidMount() {
    const mnemonic = this.getMnemonicFromNavProps()
    this.setState({
      allMnemonicWords: mnemonic.split(' '),
    })
  }

  getMnemonicFromNavProps(): string {
    const mnemonic = this.props.navigation.getParam('mnemonic', '')
    if (!mnemonic) {
      throw new Error('Mnemonic missing form nav props')
    }
    return mnemonic
  }

  onSuccess = () => {
    this.props.setBackupCompleted()
    navigate(Screens.BackupSocial)
  }

  render() {
    const { t } = this.props
    const { allMnemonicWords, userSelectedWords } = this.state

    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <Text style={fontStyles.h1}>{t('backupAndRecovery')}</Text>
          <Text style={styles.body}>{t('verifyBackupKey')}</Text>
          <BackupPhraseContainer words={userSelectedWords.join(' ')} showCopy={true} />
          {allMnemonicWords.map((word) => <Text key={'mnemonic-button-' + word}>{word}</Text>)}
        </ScrollView>
      </SafeAreaView>
    )
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { setBackupCompleted, showError, hideAlert }
  )(withNamespaces(Namespaces.backupKeyFlow6)(BackupQuiz))
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: 'center',
  },
  body: {
    ...fontStyles.body,
    paddingBottom: 15,
  },
})
