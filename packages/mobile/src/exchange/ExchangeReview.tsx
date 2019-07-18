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

interface ExchangeInfo {
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

  confirm = () => {
    const exchangeProps = this.getExchangeProps()
    this.props.exchangeTokens(exchangeProps.makerToken, exchangeProps.makerAmount)
    CeloAnalytics.track(CustomEventNames.exchange_confirm, {
      makerToken: exchangeProps.makerToken,
      makerAmount: exchangeProps.makerAmount,
    })
    navigate(Screens.ExchangeHomeScreen)
  }

  editExchange = () => {
    CeloAnalytics.track(CustomEventNames.exchange_edit)
    navigateBack()
  }

  getExchangeProps(): ExchangeInfo {
    const info = this.props.navigation.getParam('exchangeInfo', '')

    if (info === '') {
      throw new Error('Expected exchangeInfo ')
    }
    return info
  }

  renderHeader = () => {
    return <ReviewHeader title={this.props.t('reviewExchange')} />
  }

  componentDidMount() {
    const { makerToken, makerAmount } = this.getExchangeProps()
    this.props.fetchExchangeRate(makerAmount, makerToken)
  }

  render() {
    const { exchangeRatePair, fee, t, appConnected, dollarBalance, goldBalance } = this.props
    const { makerToken, makerAmount } = this.getExchangeProps()
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
            action: this.confirm,
            text: t('exchange'),
            disabled: !appConnected || rate.isZero(),
          }}
          modifyButton={{ action: this.editExchange, text: t('edit') }}
        >
          <ExchangeConfirmationCard
            token={makerToken}
            newDollarBalance={newDollarBalance}
            newGoldBalance={newGoldBalance}
            leftCurrencyAmount={makerAmount}
            rightCurrencyAmount={takerAmount}
            exchangeRate={rate.toString()}
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
