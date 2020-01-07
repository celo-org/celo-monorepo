import Button, { BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import FeeIcon from 'src/components/FeeIcon'
import { exchangeTokens, fetchExchangeRate } from 'src/exchange/actions'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { exchangeHeader } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  fee: string
  appConnected: boolean
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
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
  fee: getMoneyDisplayValue(0),
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
    this.props.fetchExchangeRate(makerToken, makerAmount)
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
    this.getExchangePropertiesFromNavProps()
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
    const { exchangeRatePair, fee, t, appConnected } = this.props

    const exchangeRate = getRateForMakerToken(
      exchangeRatePair,
      this.state.makerToken,
      CURRENCY_ENUM.DOLLAR
    )
    const dollarAmount = this.getInputAmountInToken(CURRENCY_ENUM.DOLLAR)

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
                <Text style={styles.currencyAmountText}>
                  {getMoneyDisplayValue(this.state.inputAmount, this.state.inputToken, true)}
                </Text>
              </View>
              <HorizontalLine />
              <View style={styles.subtotalRowContainer}>
                <Text style={styles.exchangeBodyText}>
                  {t('subtotalAmount', {
                    rate: getMoneyDisplayValue(exchangeRate, CURRENCY_ENUM.DOLLAR, true),
                  })}
                </Text>
                <Text style={styles.exchangeBodyText}>
                  {getMoneyDisplayValue(dollarAmount, CURRENCY_ENUM.DOLLAR, true)}
                </Text>
              </View>
              <View style={styles.feeRowContainer}>
                <View style={styles.feeTextWithIconContainer}>
                  <Text style={styles.exchangeBodyText}>{t('exchangeFee')}</Text>
                  <FeeIcon tintColor={colors.lightGray} isExchange={true} />
                </View>
                <Text style={styles.exchangeBodyText}>{fee}</Text>
              </View>
              <View style={styles.feeRowContainer}>
                <View style={styles.feeTextWithIconContainer}>
                  <Text style={styles.exchangeBodyText}>{t('securityFee')}</Text>
                  <FeeIcon tintColor={colors.lightGray} />
                </View>
                <Text style={styles.exchangeBodyText}>{fee}</Text>
              </View>
              <HorizontalLine />
              <View style={styles.rowContainer}>
                <Text style={fontStyles.bodyBold}>{t('sendFlow7:total')}</Text>
                <Text style={fontStyles.bodyBold}>
                  {getMoneyDisplayValue(dollarAmount.plus(fee), CURRENCY_ENUM.DOLLAR, true)}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>

        <View style={componentStyles.bottomContainer}>
          <Button
            onPress={this.onPressConfirm}
            text={t('buyOrSellGoldAmount', {
              buyOrSell: this.state.makerToken === CURRENCY_ENUM.DOLLAR ? t('buy') : t('sell'),
              total: getMoneyDisplayValue(
                this.getInputAmountInToken(CURRENCY_ENUM.GOLD),
                CURRENCY_ENUM.GOLD,
                false,
                3
              ),
              gold: t(`global:gold`),
            })}
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
  feeTextWithIconContainer: { flexDirection: 'row', alignItems: 'center' },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
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
  })(withTranslation(Namespaces.exchangeFlow9)(ExchangeReview))
)
