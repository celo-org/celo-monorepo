import * as React from 'react'
import { connect } from 'react-redux'
import Education from 'src/account/Education'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { setEducationCompleted } from 'src/goldToken/actions'
import { exchangeIcon, goldValue, shinyGold } from 'src/images/Images'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'

interface DispatchProps {
  setEducationCompleted: typeof setEducationCompleted
}
type Props = DispatchProps
export class GoldEducation extends React.Component<Props> {
  static navigationOptions = { header: null }
  goToExchange = () => {
    this.props.setEducationCompleted()
    CeloAnalytics.track(CustomEventNames.exchange_gold_nux)
    navigate(Screens.ExchangeHomeScreen)
  }

  goToWallet = () => {
    this.props.setEducationCompleted()
    CeloAnalytics.track(CustomEventNames.wallet_gold_nux)
    navigateBack()
  }
  render() {
    const stepInfo = [
      {
        image: shinyGold,
        text: 'celoLikeGold',
        cancelEvent: CustomEventNames.gold_cancel1,
        screenName: 'Gold_Nux_1',
      },
      {
        image: goldValue,
        text: 'goldFluctuates',
        cancelEvent: CustomEventNames.gold_cancel2,
        screenName: 'Gold_Nux_2',
      },
      {
        image: exchangeIcon,
        text: 'exchange',
        cancelEvent: CustomEventNames.gold_cancel3,
        screenName: 'Gold_Nux_3',
      },
    ]
    return (
      <Education
        stepInfo={stepInfo}
        onFinish={this.goToExchange}
        onFinishAlternate={this.goToWallet}
        buttonText={'exchangeGold'}
        linkText={'backToWallet'}
      />
    )
  }
}

export default componentWithAnalytics(
  connect<{}, DispatchProps>(
    null,
    { setEducationCompleted }
  )(GoldEducation)
)
