import LanguageSelectUI from '@celo/react-components/components/LanguageSelectUI'
import { navigate } from '@celo/react-components/services/NavigationService'
import logo from 'assets/celo-logo.png'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { NavigationScreenProps } from 'react-navigation'
import { connect } from 'react-redux'
import VerifierAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { setLanguage } from 'src/app/actions'
import i18n from 'src/i18n'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/logger'

interface State {
  selectedAnswer: string
}

interface StateProps {
  language: string | null
}

interface DispatchProps {
  setLanguage: typeof setLanguage
}

type Props = StateProps & DispatchProps & WithNamespaces & NavigationScreenProps

const mapStateToProps = (state: RootState): StateProps => {
  return {
    language: state.app.language,
  }
}

class LanguageScreen extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      selectedAnswer: props.language || i18n.language || '',
    }
  }

  onSelectAnswer = (language: string, code: string) => {
    Logger.info('LanguageScreen', `Langauge set to ${language} -> ${code}`)
    i18n.changeLanguage(code)
    this.props.setLanguage(code)
    this.setState({ selectedAnswer: code })
    this.trackSelected(code)
  }

  trackSelected(code: string) {
    const event = this.isNuxMode()
      ? CustomEventNames.welcome_language
      : CustomEventNames.new_language
    VerifierAnalytics.track(event, { lang: code })
  }

  onSubmit = () => {
    Logger.info('LanguageScreen', 'submitted')
    this.props.setLanguage(this.state.selectedAnswer)
    this.trackSubmission()
    navigate(this.nextScreen())
  }

  trackSubmission() {
    const event = this.isNuxMode()
      ? CustomEventNames.welcome_continue
      : CustomEventNames.submit_language
    VerifierAnalytics.track(event)
  }

  nextScreen = () => {
    return this.props.navigation.getParam('nextScreen', Screens.Education)
  }

  isNuxMode() {
    return this.nextScreen() === Screens.Education
  }

  render() {
    return (
      <LanguageSelectUI
        logo={logo}
        onLanguageSelected={this.onSelectAnswer}
        onSubmit={this.onSubmit}
        isSubmitDisabled={!this.state.selectedAnswer}
        currentSelected={this.state.selectedAnswer}
        t={this.props.t}
      />
    )
  }
}

export default withNamespaces()(
  connect<StateProps, DispatchProps>(
    mapStateToProps,
    { setLanguage }
  )(LanguageScreen)
)
