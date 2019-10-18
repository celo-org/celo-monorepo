import * as React from 'react'
import { connect } from 'react-redux'
import { setBackupCompleted, setBackupDelayed } from 'src/account/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { enterBackupFlow, exitBackupFlow } from 'src/app/actions'
import BackupComplete from 'src/backup/BackupComplete'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import BackupPhrase from 'src/backup/BackupPhrase'
import BackupQuestion from 'src/backup/BackupQuestion'
import { createQuizWordList, getStoredMnemonic, selectQuizWordOptions } from 'src/backup/utils'
import { navigateBack } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import { isBackupTooLate } from 'src/redux/selectors'
import Logger from 'src/utils/Logger'

export const DAYS_TO_BACKUP = 1
export const DAYS_TO_DELAY = 1 / 24 // 1 hour delay

const OPTIONS_PER_QUESTION = 4
const INDICES_TO_TEST = [0, 2, 3, 6]
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

  async componentDidMount() {
    this.props.enterBackupFlow()
    await this.retrieveMnemonic()
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

  showBackupPhrase = () => {
    this.setState({ currentQuestion: 0 })
  }

  showQuiz = () => {
    this.setState({ currentQuestion: 1 })
  }

  showNextQuestion = () => {
    this.setState({ currentQuestion: this.state.currentQuestion + 1 })
  }

  returnToPhrase = () => {
    this.setState({ currentQuestion: 0 })
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
      return (
        <BackupPhrase
          words={`${this.state.mnemonic}`}
          onPress={this.showQuiz}
          onCancel={this.onCancel}
        />
      )
    }
    if (mnemonic && currentQuestion > 0 && currentQuestion <= NUMBER_OF_TEST_QUESTIONS) {
      const indexToTest = INDICES_TO_TEST[currentQuestion - 1]
      const correctWord = mnemonic.split(' ')[indexToTest]
      const wordOptions = selectQuizWordOptions(
        correctWord,
        wordsForBackupQuiz,
        OPTIONS_PER_QUESTION
      )

      return (
        <BackupQuestion
          questionNumber={currentQuestion}
          testWordIndex={indexToTest}
          words={wordOptions}
          correctAnswer={correctWord}
          onReturnToPhrase={this.returnToPhrase}
          onCorrectSubmit={this.showNextQuestion}
          onWrongSubmit={this.returnToPhrase}
          onCancel={this.onCancel}
        />
      )
    }
    if (currentQuestion > NUMBER_OF_TEST_QUESTIONS) {
      return <BackupComplete onPress={this.onFinish} mnemonic={this.state.mnemonic} />
    }
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { setBackupCompleted, setBackupDelayed, enterBackupFlow, exitBackupFlow }
  )(Backup)
)
