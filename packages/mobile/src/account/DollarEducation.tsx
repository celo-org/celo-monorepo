import * as React from 'react'
import { connect } from 'react-redux'
import Education from 'src/account/Education'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import { componentWithAnalytics } from 'src/analytics/wrapper'
import { sendBetweenPhones, sendFee, stabilityScale } from 'src/images/Images'
import { navigate, navigateHome } from 'src/navigator/NavigationService'
import { Stacks } from 'src/navigator/Screens'
import { setEducationCompleted } from 'src/stableToken/actions'

interface DispatchProps {
  setEducationCompleted: typeof setEducationCompleted
}

type Props = DispatchProps

export class DollarEducation extends React.Component<Props> {
  static navigationOptions = { header: null }

  goToSend = () => {
    this.props.setEducationCompleted()
    CeloAnalytics.track(CustomEventNames.send_dollar_nux)
    navigate(Stacks.SendStack)
  }

  goToWalletHome = () => {
    this.props.setEducationCompleted()
    CeloAnalytics.track(CustomEventNames.wallet_dollar_nux)
    navigateHome()
  }

  render() {
    const stepInfo = [
      {
        image: stabilityScale,
        text: 'stableDollar',
        cancelEvent: CustomEventNames.dollar_cancel1,
        screenName: 'Dollar_Nux_1',
      },
      {
        image: sendFee,
        text: 'feeTransaction',
        cancelEvent: CustomEventNames.dollar_cancel2,
        screenName: 'Dollar_Nux_2',
      },
      {
        image: sendBetweenPhones,
        text: 'sendCelo',
        cancelEvent: CustomEventNames.dollar_cancel3,
        screenName: 'Dollar_Nux_3',
      },
    ]
    return (
      <Education
        stepInfo={stepInfo}
        onFinish={this.goToSend}
        onFinishAlternate={this.goToWalletHome}
        buttonText={'global:sendCeloDollars'}
        linkText={'backToWallet'}
      />
    )
  }
}

export default componentWithAnalytics(
  connect<{}, DispatchProps>(
    null,
    { setEducationCompleted }
  )(DollarEducation)
)
