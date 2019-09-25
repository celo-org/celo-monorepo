import { RootState } from '@celo/mobile/src/redux/reducers'
import LanguageSelectUI from '@celo/react-components/components/LanguageSelectUI'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { NavigationScreenProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { setLanguage } from 'src/app/actions'
import { AVAILABLE_LANGUAGES } from 'src/config'
import i18n, { Namespaces } from 'src/i18n'
import logo from 'src/images/celo-logo.png'
import { Screens } from 'src/navigator/Screens'

interface State {
  selectedAnswer: string | null
}

interface DispatchProps {
  setLanguage: typeof setLanguage
}

type Props = DispatchProps & NavigationScreenProps & WithNamespaces

export class Language extends React.Component<Props, State> {
  static navigationOptions = { header: null }

  state = {
    selectedAnswer: i18n.language || '',
  }

  onSelectAnswer = (language: string, code: string) => {
    CeloAnalytics.track(CustomEventNames.language_select, { language, selectedAnswer: code })
    this.props.setLanguage(code)
    this.setState({ selectedAnswer: code })
  }

  onSubmit = () => {
    const nextScreen = this.props.navigation.getParam('nextScreen', Screens.JoinCelo)
    CeloAnalytics.track(CustomEventNames.nux_continue, {
      nextScreen,
      selectedAnswer: this.state.selectedAnswer,
    })

    this.props.setLanguage(this.state.selectedAnswer, nextScreen)
  }

  render() {
    const { t } = this.props
    return (
      <LanguageSelectUI
        logo={logo}
        onLanguageSelected={this.onSelectAnswer}
        onSubmit={this.onSubmit}
        isSubmitDisabled={!this.state.selectedAnswer}
        currentSelected={this.state.selectedAnswer}
        languages={AVAILABLE_LANGUAGES}
        t={t}
      />
    )
  }
}

export default componentWithAnalytics(
  connect<any, DispatchProps, {}, RootState>(
    null,
    { setLanguage }
  )(withNamespaces(Namespaces.accountScreen10)(Language))
)
