import * as React from 'react'
import BackupQuestion from 'src/backup/BackupQuestion'
import { selectQuizWordOptions } from 'src/backup/utils'

const OPTIONS_PER_QUESTION = 4
export const INDICES_TO_TEST = [0, 2, 3, 6]

interface Props {
  currentQuestion: number
  mnemonic: string
  wordsForBackupQuiz: string[]
  setCurrentQuestion: (currentQuestion: number) => void
  onCancel: () => void
}

export default class BackupQuiz extends React.Component<Props> {
  showNextQuestion = () => {
    this.props.setCurrentQuestion(this.props.currentQuestion + 1)
  }

  returnToPhrase = () => {
    this.props.setCurrentQuestion(0)
  }

  render() {
    const { currentQuestion, mnemonic, wordsForBackupQuiz } = this.props

    const indexToTest = INDICES_TO_TEST[currentQuestion - 1]
    const correctWord = mnemonic.split(' ')[indexToTest]
    const wordOptions = selectQuizWordOptions(correctWord, wordsForBackupQuiz, OPTIONS_PER_QUESTION)

    return (
      <BackupQuestion
        questionNumber={currentQuestion}
        testWordIndex={indexToTest}
        words={wordOptions}
        correctAnswer={correctWord}
        onReturnToPhrase={this.returnToPhrase}
        onCorrectSubmit={this.showNextQuestion}
        onWrongSubmit={this.returnToPhrase}
        onCancel={this.props.onCancel}
      />
    )
  }
}
