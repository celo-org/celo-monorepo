import * as React from 'react'
import { AsyncStorage } from 'react-native'
import { connect } from 'react-redux'
import { setBackupCompleted } from 'src/account/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { enterBackupFlow, exitBackupFlow } from 'src/app/actions'
import BackupComplete from 'src/backup/BackupComplete'
import BackupIntroduction from 'src/backup/BackupIntroduction'
import BackupPhrase from 'src/backup/BackupPhrase'
import BackupQuestion from 'src/backup/BackupQuestion'
import { createQuizWordList, selectQuizWordOptions } from 'src/backup/utils'
import { navigateBack } from 'src/navigator/NavigationService'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

export const DAYS_TO_BACKUP = 7
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
}

interface DispatchProps {
  setBackupCompleted: typeof setBackupCompleted
  enterBackupFlow: typeof enterBackupFlow
  exitBackupFlow: typeof exitBackupFlow
}

type Props = StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language,
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

  // TODO(Rossy): Move out of here into a saga
  retrieveMnemonic = async () => {
    if (this.state.mnemonic) {
      return
    }

    try {
      const mnemonic = await AsyncStorage.getItem('mnemonic')
      if (!mnemonic) {
        throw new Error('Mnemonic not stored in memory')
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
    this.props.exitBackupFlow()
    navigateBack()
  }

  onFinish = async () => {
    this.props.exitBackupFlow()
    this.props.setBackupCompleted()
    navigateBack()
  }

  render() {
    const { mnemonic, currentQuestion, wordsForBackupQuiz } = this.state
    if (currentQuestion === -1) {
      return <BackupIntroduction onPress={this.showBackupPhrase} onCancel={this.onCancel} />
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
    { setBackupCompleted, enterBackupFlow, exitBackupFlow }
  )(Backup)
)
