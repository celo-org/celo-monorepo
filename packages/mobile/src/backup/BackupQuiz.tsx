import * as React from 'react'
import { connect } from 'react-redux'
import { setBackupCompleted } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackupQuestion from 'src/backup/BackupQuestion'
import BackupVerify from 'src/backup/BackupVerify'
import { createQuizWordList, getStoredMnemonic, selectQuizWordOptions } from 'src/backup/utils'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

const OPTIONS_PER_QUESTION = 4

interface StateProps {
  language: string | null
}

interface State {
  mnemonic: string
  wordsForBackupQuiz: string[]
  step: number
}

interface DispatchProps {
  setBackupCompleted: typeof setBackupCompleted
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language,
  }
}

export class BackupQuiz extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    mnemonic: '',
    wordsForBackupQuiz: [],
    step: 0,
  }

  componentWillMount = async () => {
    await this.retrieveMnemonic()
  }

  componentDidMount = async () => {
    this.getWords()
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

  getWords = async () => {
    const { language } = this.props
    const { mnemonic } = this.state
    const wordsForBackupQuiz = await createQuizWordList(mnemonic, language)
    this.setState({ wordsForBackupQuiz })
  }

  onCancel = () => {
    // TODO(Derrick): Analytics for cancel
    navigate(Screens.BackupIntroduction)
  }

  onSuccess = () => {
    const { step } = this.state

    if (step === 0) {
      this.setState({ step: step + 1 })
      return
    }

    this.props.setBackupCompleted()
    navigate(Screens.BackupSocialFirst)
  }

  onWrongSubmit = () => {
    // TODO(Derrick): Analytics for different wrong submits
    this.showBackupPhrase()
  }

  showBackupPhrase = () => {
    this.setState({ step: 0 })
    // TODO(Derrick): Analytics for show backup phrase
    navigate(Screens.BackupPhrase)
  }

  render() {
    const { mnemonic, wordsForBackupQuiz, step } = this.state

    // Empty defaults should not show as we fetch mnemonic before mount
    const [correctWord = '', wordOptions = []] = selectQuizWordOptions(
      mnemonic,
      wordsForBackupQuiz,
      OPTIONS_PER_QUESTION
    )

    if (step === 0) {
      return (
        <BackupQuestion
          words={wordOptions}
          correctAnswer={correctWord}
          onReturnToPhrase={this.showBackupPhrase}
          onCorrectSubmit={this.onSuccess}
          onWrongSubmit={this.onWrongSubmit}
          onCancel={this.onCancel}
        />
      )
    }

    return (
      <BackupVerify
        mnemonic={mnemonic}
        showBackupPhrase={this.showBackupPhrase}
        onSuccess={this.onSuccess}
        onWrongSubmit={this.onWrongSubmit}
        onCancel={this.onCancel}
      />
    )
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { setBackupCompleted, showError, hideAlert }
  )(BackupQuiz)
)
