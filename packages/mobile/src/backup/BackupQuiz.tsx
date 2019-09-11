import * as React from 'react'
import BackupQuestion from 'src/backup/BackupQuestion'
import { createQuizWordList, selectQuizWordOptions } from 'src/backup/utils'

const OPTIONS_PER_QUESTION = 4

interface Props {
  mnemonic: string
  language: string | null
  showBackupPhrase: () => void
  onCancel: () => void
  onSuccess: () => void
}

interface State {
  wordsForBackupQuiz: string[]
}

export default class BackupQuiz extends React.Component<Props, State> {
  state = {
    wordsForBackupQuiz: [],
  }

  componentDidMount = () => {
    this.getWords()
  }

  getWords = async () => {
    const { mnemonic, language } = this.props
    const wordsForBackupQuiz = await createQuizWordList(mnemonic, language)
    this.setState({ wordsForBackupQuiz })
  }

  render() {
    const { mnemonic, showBackupPhrase, onCancel, onSuccess } = this.props
    const { wordsForBackupQuiz } = this.state

    const [correctWord, wordOptions] = selectQuizWordOptions(
      mnemonic,
      wordsForBackupQuiz,
      OPTIONS_PER_QUESTION
    )

    return (
      <BackupQuestion
        words={wordOptions}
        correctAnswer={correctWord}
        onReturnToPhrase={showBackupPhrase}
        onCorrectSubmit={onSuccess}
        onWrongSubmit={showBackupPhrase}
        onCancel={onCancel}
      />
    )
  }
}
