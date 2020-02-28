import Button, { BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeIcon from 'src/components/FeeIcon'
import { exchangeTokens, fetchExchangeRate, fetchTobinTax } from 'src/exchange/actions'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode, getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { exchangeHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  localCurrencyCode: LocalCurrencyCode
  localCurrencyExchangeRate: string | null | undefined
  tobinTax: string
  fee: string
  appConnected: boolean
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  fetchTobinTax: typeof fetchTobinTax
  exchangeTokens: typeof exchangeTokens
}

interface NavProps {
  exchangeInput: {
    makerToken: CURRENCY_ENUM
    makerTokenBalance: string
    inputToken: CURRENCY_ENUM
    inputTokenDisplayName: string
    inputAmount: BigNumber
  }
}

interface State {
  makerToken: CURRENCY_ENUM
  inputToken: CURRENCY_ENUM
  inputTokenDisplayName: string
  inputAmount: BigNumber
}

type Props = StateProps & WithTranslation & DispatchProps & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRatePair: state.exchange.exchangeRatePair,
  localCurrencyCode: getLocalCurrencyCode(state),
  localCurrencyExchangeRate: getLocalCurrencyExchangeRate(state),
  tobinTax: state.exchange.tobinTax || '0',
  fee: '0',
  appConnected: isAppConnected(state),
})

export class ExchangeReview extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavProps>) => {
    const { makerToken, makerTokenBalance } = navigation.getParam('exchangeInput')
    return {
      ...exchangeHeader(makerToken, makerTokenBalance),
    }
  }

  state: State = {
    makerToken: CURRENCY_ENUM.GOLD,
    inputToken: CURRENCY_ENUM.GOLD,
    inputTokenDisplayName: this.props.t('global:gold'),
    inputAmount: new BigNumber(0),
  }

  onPressConfirm = () => {
    const makerToken = this.state.makerToken
    const makerAmount = this.getMakerAmount()
    this.props.exchangeTokens(makerToken, makerAmount)
    CeloAnalytics.track(CustomEventNames.exchange_confirm, {
      makerToken,
      makerAmount,
    })
    navigate(Screens.ExchangeHomeScreen)
  }

  getExchangePropertiesFromNavProps() {
    const {
      makerToken,
      inputAmount,
      inputToken,
      inputTokenDisplayName,
    } = this.props.navigation.getParam('exchangeInput')
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
    const {
      exchangeRatePair,
      localCurrencyCode,
      localCurrencyExchangeRate,
      fee,
      t,
      appConnected,
      tobinTax,
    } = this.props

    const exchangeRate = getRateForMakerToken(
      exchangeRatePair,
      this.state.makerToken,
      CURRENCY_ENUM.DOLLAR
    )
    const dollarAmount = this.getInputAmountInToken(CURRENCY_ENUM.DOLLAR)

    const totalAmount = {
      value: dollarAmount
        .plus(tobinTax)
        .plus(fee)
        .toString(),
      currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
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
                    tokenName: t(`global:${this.state.inputTokenDisplayName}`),
                  })}
                </Text>
                <CurrencyDisplay
                  style={styles.currencyAmountText}
                  amount={{
                    value: this.state.inputAmount.toString(),
                    currencyCode: CURRENCIES[this.state.inputToken].code,
                  }}
                />
              </View>
              <HorizontalLine />
              <View style={styles.subtotalRowContainer}>
                <Text style={styles.exchangeBodyText}>
                  <Trans i18nKey="subtotalAmount" ns={Namespaces.exchangeFlow9}>
                    Subtotal @{' '}
                    <CurrencyDisplay
                      amount={{
                        value: exchangeRate.toString(),
                        currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                      }}
                    />
                  </Trans>
                </Text>
                <CurrencyDisplay
                  style={styles.exchangeBodyText}
                  amount={{
                    value: dollarAmount.toString(),
                    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                  }}
                />
              </View>
              <View style={styles.feeRowContainer}>
                <View style={styles.feeTextWithIconContainer}>
                  <Text style={styles.exchangeBodyText}>{t('exchangeFee')}</Text>
                  <FeeIcon tintColor={colors.lightGray} isExchange={true} />
                </View>
                <CurrencyDisplay
                  style={styles.exchangeBodyText}
                  amount={{
                    value: tobinTax,
                    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                  }}
                />
              </View>
              <View style={styles.feeRowContainer}>
                <View style={styles.feeTextWithIconContainer}>
                  <Text style={styles.exchangeBodyText}>{t('securityFee')}</Text>
                  <FeeIcon tintColor={colors.lightGray} />
                </View>
                <CurrencyDisplay
                  style={styles.exchangeBodyText}
                  amount={{
                    value: fee,
                    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                  }}
                />
              </View>
              <HorizontalLine />
              <View style={styles.totalContainer}>
                <Text style={fontStyles.bodyBold}>{t('sendFlow7:total')}</Text>
                <CurrencyDisplay style={fontStyles.bodyBold} amount={totalAmount} />
              </View>
              {localCurrencyCode !== LocalCurrencyCode.USD && !!localCurrencyExchangeRate && (
                <View style={styles.totalDollarsContainer}>
                  <Text style={styles.dollarsText}>
                    <Trans i18nKey="totalInDollars" ns={Namespaces.exchangeFlow9}>
                      Celo Dollars (@{' '}
                      <CurrencyDisplay
                        amount={{
                          value: new BigNumber(localCurrencyExchangeRate).pow(-1).toString(),
                          currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                        }}
                        showLocalAmount={false}
                      />
                      )
                    </Trans>
                  </Text>
                  <CurrencyDisplay
                    style={styles.dollarsText}
                    amount={totalAmount}
                    hideSymbol={true}
                    showLocalAmount={false}
                  />
                </View>
              )}
            </View>
          </ScrollView>
        </View>

        <View style={componentStyles.bottomContainer}>
          <Button
            onPress={this.onPressConfirm}
            text={
              <Trans
                i18nKey={
                  this.state.makerToken === CURRENCY_ENUM.DOLLAR
                    ? 'buyGoldAmount'
                    : 'sellGoldAmount'
                }
                ns={Namespaces.exchangeFlow9}
              >
                Buy or sell{' '}
                <CurrencyDisplay
                  amount={{
                    value: this.getInputAmountInToken(CURRENCY_ENUM.GOLD).toString(),
                    currencyCode: CURRENCIES[CURRENCY_ENUM.GOLD].code,
                  }}
                />
                Gold
              </Trans>
            }
            standard={false}
            disabled={!appConnected || exchangeRate.isZero()}
            type={BtnTypes.PRIMARY}
          />
        </View>
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
  },
  flexStart: {
    justifyContent: 'flex-start',
  },
  headerTextContainer: { flex: 1, alignSelf: 'center', alignItems: 'center' },
  exchangeBodyText: { ...fontStyles.body, fontSize: 15 },
  currencyAmountText: { ...fontStyles.body, fontSize: 24, lineHeight: 39, color: colors.celoGreen },
  dollarsText: { ...fontStyles.body, fontSize: 15, color: colors.darkSecondary },
  feeTextWithIconContainer: { flexDirection: 'row', alignItems: 'center' },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  totalDollarsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  subtotalRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    marginTop: 20,
  },
  feeRowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 30,
  },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
    exchangeTokens,
    fetchExchangeRate,
    fetchTobinTax,
  })(withTranslation(Namespaces.exchangeFlow9)(ExchangeReview))
)
