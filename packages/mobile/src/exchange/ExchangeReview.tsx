import ReviewFrame from '@celo/react-components/components/ReviewFrame'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, View } from 'react-native'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { exchangeTokens, fetchExchangeRate } from 'src/exchange/actions'
import ExchangeConfirmationCard from 'src/exchange/ExchangeConfirmationCard'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM as Token } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import {
  getNewDollarBalance,
  getNewGoldBalance,
  getRateForMakerToken,
  getTakerAmount,
} from 'src/utils/currencyExchange'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface StateProps {
  dollarBalance: string | null
  goldBalance: string | null
  exchangeRatePair: ExchangeRatePair | null
  fee: string
  appConnected: boolean
}

interface ConfirmationInput {
  makerAmount: BigNumber
  makerToken: Token
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  exchangeTokens: typeof exchangeTokens
}

type Props = StateProps & WithNamespaces & DispatchProps & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  goldBalance: state.goldToken.balance,
  dollarBalance: state.stableToken.balance,
  exchangeRatePair: state.exchange.exchangeRatePair,
  fee: getMoneyDisplayValue(0),
  appConnected: isAppConnected(state),
})

class ExchangeReview extends React.Component<Props> {
  static navigationOptions = { header: null }

  onPressConfirm = () => {
    const confirmationInput = this.getConfirmationInput()
    this.props.exchangeTokens(confirmationInput.makerToken, confirmationInput.makerAmount)
    CeloAnalytics.track(CustomEventNames.exchange_confirm, {
      makerToken: confirmationInput.makerToken,
      makerAmount: confirmationInput.makerAmount,
    })
    navigate(Screens.ExchangeHomeScreen)
  }

  onPressEdit = () => {
    CeloAnalytics.track(CustomEventNames.exchange_edit)
    navigateBack()
  }

  getConfirmationInput(): ConfirmationInput {
    const confirmationInput = this.props.navigation.getParam('confirmationInput', '')

    if (confirmationInput === '') {
      throw new Error('Expected exchangeInfo ')
    }
    return confirmationInput
  }

  componentDidMount() {
    const { makerToken, makerAmount } = this.getConfirmationInput()
    this.props.fetchExchangeRate(makerAmount, makerToken)
  }

  renderHeader = () => {
    return <ReviewHeader title={this.props.t('reviewExchange')} />
  }

  render() {
    const { exchangeRatePair, fee, t, appConnected, dollarBalance, goldBalance } = this.props
    const { makerToken, makerAmount } = this.getConfirmationInput()
    const rate = getRateForMakerToken(exchangeRatePair, makerToken)
    const takerAmount = getTakerAmount(makerAmount, rate)
    const newGoldBalance = getNewGoldBalance(goldBalance, makerToken, makerAmount, takerAmount)
    const newDollarBalance = getNewDollarBalance(
      dollarBalance,
      makerToken,
      makerAmount,
      takerAmount
    )

    return (
      <View style={styles.container}>
        <DisconnectBanner />
        <ReviewFrame
          HeaderComponent={this.renderHeader}
          confirmButton={{
            action: this.onPressConfirm,
            text: t('exchange'),
            disabled: !appConnected || rate.isZero(),
          }}
          modifyButton={{ action: this.onPressEdit, text: t('edit') }}
        >
          <ExchangeConfirmationCard
            makerToken={makerToken}
            newDollarBalance={newDollarBalance}
            newGoldBalance={newGoldBalance}
            makerAmount={makerAmount}
            takerAmount={takerAmount}
            exchangeRate={rate}
            fee={fee}
          />
        </ReviewFrame>
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 20,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { exchangeTokens, fetchExchangeRate }
  )(withNamespaces(Namespaces.exchangeFlow9)(ExchangeReview))
)
