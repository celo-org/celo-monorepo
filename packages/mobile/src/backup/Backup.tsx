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

enum BackupStep {
  introduction,
  phrase,
  socialBackup,
  quiz,
  complete,
}

interface State {
  mnemonic: string
  currentQuestion: number | null
  wordsForBackupQuiz: string[]
  backupStep: BackupStep
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
    backupStep: BackupStep.introduction,
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
    if (currentQuestion > NUMBER_OF_TEST_QUESTIONS) {
      this.setState({ backupStep: BackupStep.complete })
      return
    }

    this.setState({ currentQuestion })
  }

  showBackupPhrase = () => {
    this.setState({ backupStep: BackupStep.phrase })
  }

  showQuiz = () => {
    this.setState({ currentQuestion: 1, backupStep: BackupStep.quiz })
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
    const { mnemonic, currentQuestion, wordsForBackupQuiz, backupStep } = this.state
    const { backupCompleted, backupDelayedTime, backupTooLate } = this.props

    // if backup is completed before this component is mounted, different from BackupStep.complete
    if (backupCompleted) {
      return (
        <BackupComplete
          backupCompleted={backupCompleted}
          onPress={this.onCancel}
          mnemonic={mnemonic}
        />
      )
    }

    if (backupStep === BackupStep.introduction) {
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

    if (backupStep === BackupStep.phrase) {
      return <BackupPhrase words={mnemonic} onPress={this.showQuiz} onCancel={this.onCancel} />
    }

    if (backupStep === BackupStep.quiz) {
      return (
        <BackupQuiz
          mnemonic={mnemonic}
          wordsForBackupQuiz={wordsForBackupQuiz}
          currentQuestion={currentQuestion}
          onCancel={this.onCancel}
          setCurrentQuestion={this.setCurrentQuestion}
          showBackupPhrase={this.showBackupPhrase}
        />
      )
    }

    // backupComplete prop set after this screen
    if (backupStep === BackupStep.complete) {
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
