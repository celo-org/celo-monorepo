import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import ReviewHeader from '@celo/react-components/components/ReviewHeader'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { exchangeTokens, fetchExchangeRate } from 'src/exchange/actions'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCY_ENUM as Token } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import { isAppConnected } from 'src/redux/selectors'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'

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
  makerToken: Token
  makerTokenBalance: string
  inputToken: Token
  inputTokenCode: string
  inputAmount: BigNumber
}

interface State {
  makerToken: Token
  inputToken: Token
  inputTokenCode: string
  inputAmount: BigNumber
}

type Props = StateProps & WithNamespaces & DispatchProps & NavigationInjectedProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRatePair: state.exchange.exchangeRatePair,
  fee: getMoneyDisplayValue(0),
  appConnected: isAppConnected(state),
})

class ExchangeReview extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavProps>) => {
    const makerToken = navigation.getParam('makerToken')
    const title = makerToken === Token.DOLLAR ? 'Buy Gold' : 'Sell Gold' // TODO(anna) translate
    const makerTokenBalance = navigation.getParam('makerTokenBalance')
    return {
      ...headerWithCancelButton,
      headerTitle: (
        <View style={styles.headerTextContainer}>
          <Text style={fontStyles.headerBoldTitle}>{title}</Text>
          <View>
            <Text style={fontStyles.subSmall}>
              {getMoneyDisplayValue(makerTokenBalance, makerToken, true) +
                ' ' +
                i18n.t(`${Namespaces.exchangeFlow9}:lowerCaseAvailable`)}
            </Text>
          </View>
        </View>
      ),
    }
  }

  state: State = {
    makerToken: Token.GOLD,
    inputToken: Token.GOLD,
    inputTokenCode: 'gold',
    inputAmount: new BigNumber(0),
  }

  onPressConfirm = () => {
    // const confirmationInput = this.getConfirmationInput()
    /*
    this.props.exchangeTokens(confirmationInput.makerToken, confirmationInput.makerAmount)
    CeloAnalytics.track(CustomEventNames.exchange_confirm, {
      makerToken: confirmationInput.makerToken,
      makerAmount: confirmationInput.makerAmount,
    })
    */
    navigate(Screens.ExchangeHomeScreen)
  }

  getExchangePropertiesFromNavProps() {
    const makerToken = this.props.navigation.getParam('makerToken')
    const inputToken = this.props.navigation.getParam('inputToken')
    const inputTokenCode = this.props.navigation.getParam('inputTokenCode')
    const inputAmount = this.props.navigation.getParam('inputAmount')
    this.setState({
      makerToken,
      inputToken,
      inputTokenCode,
      inputAmount,
    })
    this.props.fetchExchangeRate(makerToken, inputAmount) // TODO convert input amount if necessary
    Logger.debug('@getExchangePropertiesFromNavProps', JSON.stringify(this.props.exchangeRatePair))
  }

  componentDidMount() {
    this.getExchangePropertiesFromNavProps()
  }

  renderHeader = () => {
    return <ReviewHeader title={this.props.t('reviewExchange')} />
  }

  render() {
    const { exchangeRatePair, fee, t, appConnected } = this.props
    const goldRateInDollars = getRateForMakerToken(exchangeRatePair, Token.DOLLAR)
    let dollarAmount = this.state.inputAmount
    const dollarRateInGold = getRateForMakerToken(exchangeRatePair, Token.GOLD)
    if (this.state.inputToken === Token.GOLD) {
      dollarAmount = getTakerAmount(this.state.inputAmount, dollarRateInGold)
    }

    return (
      <SafeAreaView style={styles.container}>
        <View
          style={{
            paddingHorizontal: 16,
          }}
        >
          <DisconnectBanner />
          <KeyboardAwareScrollView keyboardShouldPersistTaps={'always'}>
            <View
              style={{
                flexDirection: 'column',
                justifyContent: 'flex-start',
              }}
            >
              <View style={[styles.rowContainer, styles.amountRow]}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>
                  Amount ({this.state.inputTokenCode})
                </Text>
                <Text style={[fontStyles.body, styles.currencyAmountText]}>
                  {this.state.inputAmount.toString()}
                </Text>
              </View>
              <View style={styles.line} />
              <View style={[styles.rowContainer, styles.feeRowContainer]}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>
                  Subtotal @ {getMoneyDisplayValue(goldRateInDollars, Token.DOLLAR, true)}
                </Text>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>
                  {getMoneyDisplayValue(dollarAmount, Token.DOLLAR, true)}
                </Text>
              </View>
              <View style={[styles.rowContainer, styles.feeRowContainer]}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>Exchange Fee</Text>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>{fee}</Text>
              </View>
              <View style={[styles.rowContainer, styles.feeRowContainer]}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>Security Fee</Text>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>{fee}</Text>
              </View>
              <View style={styles.line} />
              <View style={styles.rowContainer}>
                <Text style={[fontStyles.bodyBold]}>Total</Text>
                <Text style={fontStyles.bodyBold}>
                  {getMoneyDisplayValue(dollarAmount.plus(fee), Token.DOLLAR, true)}
                </Text>
              </View>
              <Text style={[fontStyles.bodyBold]}>{JSON.stringify(exchangeRatePair)}</Text>
            </View>
          </KeyboardAwareScrollView>
        </View>

        <View style={componentStyles.bottomContainer}>
          <Button
            onPress={this.onPressConfirm}
            text={t(`${Namespaces.walletFlow5}:review`)}
            standard={false}
            disabled={!appConnected || goldRateInDollars.isZero()}
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
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  headerTextContainer: { flex: 1, alignSelf: 'center', alignItems: 'center' },
  line: {
    borderBottomColor: colors.darkLightest,
    borderBottomWidth: 1,
    marginVertical: 10,
  },
  exchangeBodyText: { fontSize: 15 },
  currencyAmountText: { fontSize: 24, lineHeight: 39, color: colors.celoGreen },

  rowContainer: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  feeRowContainer: { marginVertical: 5 },
  amountRow: { marginTop: 30 },
})

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    { exchangeTokens, fetchExchangeRate }
  )(withNamespaces(Namespaces.exchangeFlow9)(ExchangeReview))
)
