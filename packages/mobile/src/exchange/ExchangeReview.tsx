import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import CurrencyDisplay, { FormatType } from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import LineItemRow from 'src/components/LineItemRow.v2'
import TotalLineItem from 'src/components/TotalLineItem'
import { exchangeTokens, fetchExchangeRate, fetchTobinTax } from 'src/exchange/actions'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { convertDollarsToLocalAmount } from 'src/localCurrency/convert'
import { getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  tobinTax: string
  fee: string
  appConnected: boolean
  localCurrencyExchangeRate: string | null | undefined
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  fetchTobinTax: typeof fetchTobinTax
  exchangeTokens: typeof exchangeTokens
}

interface State {
  makerToken: CURRENCY_ENUM
  inputToken: CURRENCY_ENUM
  inputTokenDisplayName: string
  inputAmount: BigNumber
}

type OwnProps = StackScreenProps<StackParamList, Screens.ExchangeReview>

type Props = StateProps & WithTranslation & DispatchProps & OwnProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRatePair: state.exchange.exchangeRatePair,
  tobinTax: state.exchange.tobinTax || '0',
  fee: '0',
  appConnected: isAppConnected(state),
  localCurrencyExchangeRate: getLocalCurrencyExchangeRate(state),
})

export class ExchangeReview extends React.Component<Props, State> {
  state: State = {
    makerToken: CURRENCY_ENUM.GOLD,
    inputToken: CURRENCY_ENUM.GOLD,
    inputTokenDisplayName: this.props.t('global:gold'),
    inputAmount: new BigNumber(0),
  }

  onPressConfirm = () => {
    const { makerToken, inputToken, inputAmount } = this.state
    const makerAmount = this.getMakerAmount()
    // BEGIN: Analytics
    const isDollarToGold = inputToken === CURRENCY_ENUM.DOLLAR
    const goldToDollarExchangeRate = getRateForMakerToken(
      this.props.exchangeRatePair,
      this.state.makerToken,
      CURRENCY_ENUM.DOLLAR
    )
    const goldAmount = isDollarToGold ? makerAmount : inputAmount
    const dollarsAmount = isDollarToGold ? inputAmount : makerAmount
    const localCurrencyAmount = convertDollarsToLocalAmount(
      dollarsAmount,
      this.props.localCurrencyExchangeRate
    )
    ValoraAnalytics.track(
      isDollarToGold ? CeloExchangeEvents.celo_buy_confirm : CeloExchangeEvents.celo_sell_confirm,
      {
        localCurrencyAmount: localCurrencyAmount
          ? localCurrencyAmount.toString()
          : localCurrencyAmount,
        goldAmount: goldAmount.toString(),
        inputToken,
        goldToDollarExchangeRate: goldToDollarExchangeRate.toString(),
      }
    )

    this.props.exchangeTokens(makerToken, makerAmount)
  }

  getExchangePropertiesFromNavProps() {
    const {
      makerToken,
      inputAmount,
      inputToken,
      inputTokenDisplayName,
    } = this.props.route.params.exchangeInput
    if (!makerToken || !inputAmount || !inputToken || !inputTokenDisplayName) {
      throw new Error('Missing exchange input from nav props')
    }
    this.setState({
      makerToken,
      inputToken,
      inputTokenDisplayName,
      inputAmount,
    })
    // Update exchange rate based on makerToken and makerAmount
    let makerAmount = inputAmount
    if (inputToken !== makerToken) {
      // Convert input amount to makerToken if necessary
      const exchangeRate = getRateForMakerToken(this.props.exchangeRatePair, makerToken, inputToken)
      makerAmount = getTakerAmount(inputAmount, exchangeRate)
    }
    return { makerToken, makerAmount }
  }

  getMakerAmount() {
    let input = this.state.inputAmount
    if (this.state.makerToken !== this.state.inputToken) {
      const exchangeRate = getRateForMakerToken(
        this.props.exchangeRatePair,
        this.state.makerToken,
        this.state.inputToken
      )
      input = getTakerAmount(input, exchangeRate)
    }
    return input
  }

  componentDidMount() {
    const { makerToken, makerAmount } = this.getExchangePropertiesFromNavProps()
    this.props.fetchTobinTax(makerAmount, makerToken)
    this.props.fetchExchangeRate(makerToken, makerAmount)
  }

  getInputAmountInToken(token: CURRENCY_ENUM) {
    let amount = this.state.inputAmount
    if (this.state.inputToken !== token) {
      const conversionRate = getRateForMakerToken(
        this.props.exchangeRatePair,
        this.state.makerToken,
        this.state.inputToken
      )
      amount = getTakerAmount(amount, conversionRate)
    }
    return amount
  }

  render() {
    const { exchangeRatePair, fee, t, appConnected, tobinTax } = this.props

    const exchangeRate = getRateForMakerToken(
      exchangeRatePair,
      this.state.makerToken,
      CURRENCY_ENUM.DOLLAR
    )
    const dollarAmount = this.getInputAmountInToken(CURRENCY_ENUM.DOLLAR)

    const exchangeAmount = {
      value: this.state.inputAmount,
      currencyCode: CURRENCIES[this.state.inputToken].code,
    }
    const exchangeRateAmount = {
      value: exchangeRate,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }
    const subtotalAmount = {
      value: dollarAmount,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }
    const exchangeFeeAmount = {
      value: tobinTax,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }
    const securityFeeAmount = {
      value: fee,
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }
    const totalAmount = {
      value: dollarAmount.plus(tobinTax).plus(fee),
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
    }

    const goldAmount = {
      value: this.getInputAmountInToken(CURRENCY_ENUM.GOLD),
      currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code,
    }

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.paddedContainer}>
          <DisconnectBanner />
          <ScrollView>
            <View style={styles.flexStart}>
              <View style={styles.amountRow}>
                <Text style={styles.exchangeBodyText}>
                  {t('exchangeAmount', {
                    tokenName: this.state.inputTokenDisplayName,
                  })}
                </Text>
                <CurrencyDisplay style={styles.currencyAmountText} amount={exchangeAmount} />
              </View>
              <HorizontalLine />
              <LineItemRow
                title={
                  <Trans i18nKey="subtotalAmount" ns={Namespaces.exchangeFlow9}>
                    Subtotal @ <CurrencyDisplay amount={exchangeRateAmount} />
                  </Trans>
                }
                amount={<CurrencyDisplay amount={subtotalAmount} />}
              />
              <LineItemRow
                title={t('exchangeFee')}
                titleIcon={<FeeIcon />}
                amount={<CurrencyDisplay amount={exchangeFeeAmount} formatType={FormatType.Fee} />}
              />
              <LineItemRow
                title={t('securityFee')}
                titleIcon={<FeeIcon isExchange={true} />}
                amount={<CurrencyDisplay amount={securityFeeAmount} formatType={FormatType.Fee} />}
              />
              <HorizontalLine />
              <TotalLineItem amount={totalAmount} />
            </View>
          </ScrollView>
        </View>
        <Button
          onPress={this.onPressConfirm}
          size={BtnSizes.FULL}
          text={
            <Trans
              i18nKey={
                this.state.makerToken === CURRENCY_ENUM.DOLLAR ? 'buyGoldAmount' : 'sellGoldAmount'
              }
              ns={Namespaces.exchangeFlow9}
            >
              Buy or sell <CurrencyDisplay amount={goldAmount} /> Gold
            </Trans>
          }
          style={styles.buyBtn}
          disabled={!appConnected || exchangeRate.isZero()}
          type={BtnTypes.TERTIARY}
        />
      </SafeAreaView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  paddedContainer: {
    paddingHorizontal: 16,
    flex: 1,
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
  exchangeBodyText: {
    ...fontStyles.regular,
  },
  currencyAmountText: {
    ...fontStyles.regular,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
  buyBtn: {
    padding: variables.contentPadding,
  },
})

export default connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
  exchangeTokens,
  fetchExchangeRate,
  fetchTobinTax,
})(withTranslation<Props>(Namespaces.exchangeFlow9)(ExchangeReview))
