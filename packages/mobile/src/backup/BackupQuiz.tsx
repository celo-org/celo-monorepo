import * as React from 'react'
import { connect } from 'react-redux'
import { setBackupCompleted } from 'src/account/actions'
import { hideAlert, showError } from 'src/alert/actions'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import BackupVerify from 'src/backup/BackupVerify'
import { getStoredMnemonic, selectQuizWordOptions } from 'src/backup/utils'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

interface StateProps {
  language: string | null
}

interface State {
  mnemonic: string
  wordsForBackupQuiz: string[]
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
  static navigationOptions = () => ({
    ...headerWithCancelButton,
  })

  state = {
    mnemonic: '',
    wordsForBackupQuiz: [],
  }

  componentDidMount = () => {
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

  onSuccess = () => {
    this.props.setBackupCompleted()
    navigate(Screens.BackupSocial)
  }

  onWrongSubmit = () => {
    // TODO(Derrick): Analytics for different wrong submits
    this.showBackupPhrase()
  }

  render() {
    const { mnemonic, wordsForBackupQuiz } = this.state

    // Empty defaults should not show as we fetch mnemonic before mount
    const [correctWord = '', wordOptions = []] = selectQuizWordOptions(
      mnemonic,
      wordsForBackupQuiz,
      OPTIONS_PER_QUESTION
    )

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
