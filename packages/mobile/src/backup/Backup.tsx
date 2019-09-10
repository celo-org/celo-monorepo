import * as React from 'react'
import { connect } from 'react-redux'
import { setBackupCompleted, setBackupDelayed } from 'src/account/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { enterBackupFlow, exitBackupFlow } from 'src/app/actions'
import BackupComplete from 'src/backup/BackupComplete'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import BackupPhrase from 'src/backup/BackupPhrase'
import BackupQuiz, { INDICES_TO_TEST } from 'src/backup/BackupQuiz'
import { createQuizWordList, getStoredMnemonic } from 'src/backup/utils'
import { navigateBack } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'
import Logger from 'src/utils/Logger'

export const DAYS_TO_BACKUP = 1
export const DAYS_TO_DELAY = 1 / 24 // 1 hour delay

const NUMBER_OF_TEST_QUESTIONS = INDICES_TO_TEST.length

interface State {
  mnemonic: string
  currentQuestion: number | null
  wordsForBackupQuiz: string[]
}

interface StateProps {
  language: string | null
  backupCompleted: boolean
  backupTooLate: boolean
  backupDelayedTime: number
}

interface DispatchProps {
  setBackupCompleted: typeof setBackupCompleted
  setBackupDelayed: typeof setBackupDelayed
  enterBackupFlow: typeof enterBackupFlow
  exitBackupFlow: typeof exitBackupFlow
}

type Props = StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language,
    backupCompleted: state.account.backupCompleted,
    backupTooLate: isBackupTooLate(state),
    backupDelayedTime: state.account.backupDelayedTime,
  }
}

export class Backup extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    mnemonic: '',
    currentQuestion: -1,
    wordsForBackupQuiz: [],
  }

  componentDidMount() {
    this.retrieveMnemonic()
    this.props.enterBackupFlow()
  }

  componentWillUnmount() {
    // Exit backup flow in unmount instead of cancel, as back button will not trigger onCancel().
    this.props.exitBackupFlow()
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

      const wordsForBackupQuiz = await createQuizWordList(mnemonic, this.props.language)
      this.setState({ wordsForBackupQuiz })
    } catch (e) {
      Logger.error('backup/retrieveMnemonic', e)
      // TODO(Rossy): use error banner
      Logger.showError('Error retrieving mnemonic')
    }
  }

  setCurrentQuestion = (currentQuestion: number) => {
    this.setState({ currentQuestion })
  }

  showBackupPhrase = () => {
    this.setCurrentQuestion(0)
  }

  showQuiz = () => {
    this.setCurrentQuestion(1)
  }

  onCancel = async () => {
    navigateBack()
  }

  onDelay = () => {
    this.props.setBackupDelayed()
    navigateBack()
  }

  onFinish = async () => {
    this.props.setBackupCompleted()
    navigateBack()
  }

  render() {
    const { mnemonic, currentQuestion, wordsForBackupQuiz } = this.state
    const { backupCompleted, backupDelayedTime, backupTooLate } = this.props

    if (backupCompleted) {
      return (
        <BackupComplete
          backupCompleted={backupCompleted}
          onPress={this.onCancel}
          mnemonic={mnemonic}
        />
      )
    }

    if (currentQuestion === -1) {
      return (
        <BackupIntroduction
          onPress={this.showBackupPhrase}
          onCancel={this.onCancel}
          onDelay={this.onDelay}
          backupTooLate={backupTooLate}
          backupDelayedTime={backupDelayedTime}
        />
      )
    }

    if (currentQuestion === 0) {
      return <BackupPhrase words={mnemonic} onPress={this.showQuiz} onCancel={this.onCancel} />
    }

    if (currentQuestion <= NUMBER_OF_TEST_QUESTIONS) {
      return (
        <BackupQuiz
          mnemonic={mnemonic}
          wordsForBackupQuiz={wordsForBackupQuiz}
          currentQuestion={currentQuestion}
          onCancel={this.onCancel}
          setCurrentQuestion={this.setCurrentQuestion}
        />
      )
    }

    if (currentQuestion > NUMBER_OF_TEST_QUESTIONS) {
      return <BackupComplete onPress={this.onFinish} mnemonic={this.state.mnemonic} />
    }

    // Mnemonic missing unhandled
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { setBackupCompleted, setBackupDelayed, enterBackupFlow, exitBackupFlow }
  )(Backup)
)
