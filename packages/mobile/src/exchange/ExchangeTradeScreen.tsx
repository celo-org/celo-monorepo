import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { parseInputAmount } from '@celo/utils/src/parsing'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { NavigationInjectedProps } from 'react-navigation'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DOLLAR_TRANSACTION_MIN_AMOUNT, GOLD_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import { ExchangeHeader } from 'src/exchange/ExchangeHeader'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface State {
  inputToken: CURRENCY_ENUM
  makerToken: CURRENCY_ENUM
  makerTokenAvailableBalance: string
  inputAmount: string
}

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  error: ErrorMessages | null
}

interface NavProps {
  makerToken: CURRENCY_ENUM
  makerTokenBalance: string
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & NavigationInjectedProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRatePair: state.exchange.exchangeRatePair,
  error: errorSelector(state),
})

export class ExchangeTradeScreen extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavProps>) => {
    return ExchangeHeader(
      navigation.getParam('makerToken'),
      navigation.getParam('makerTokenBalance')
    )
  }

  state: State = {
    inputToken: CURRENCY_ENUM.GOLD,
    makerToken: CURRENCY_ENUM.DOLLAR,
    makerTokenAvailableBalance: '',
    inputAmount: '',
  }

  getMakerTokenPropertiesFromNavProps() {
    const makerToken = this.props.navigation.getParam('makerToken')
    const makerTokenAvailableBalance = this.props.navigation.getParam('makerTokenBalance')
    if (!makerToken || !makerTokenAvailableBalance) {
      throw new Error('Maker token or maker token balance missing from nav props')
    }
    this.setState({
      makerToken,
      makerTokenAvailableBalance,
    })
    this.props.fetchExchangeRate(makerToken, makerTokenAvailableBalance)
  }

  componentDidMount() {
    this.getMakerTokenPropertiesFromNavProps()
  }

  onChangeExchangeAmount = (amount: string) => {
    this.setState({ inputAmount: amount })
    this.updateError(amount)
  }

  updateError(inputAmount: string) {
    const amount = parseInputAmount(inputAmount)
    if (!this.inputAmountIsValid(amount)) {
      this.props.showError(
        this.isDollarToGold() ? ErrorMessages.NSF_DOLLARS : ErrorMessages.NSF_GOLD
      )
    } else {
      this.props.hideAlert()
    }
  }

  goToReview = () => {
    const { inputToken, inputAmount } = this.state
    const inputTokenCode = this.getInputTokenDisplayText()
    navigate(Screens.ExchangeReview, {
      makerToken: this.state.makerToken,
      makerTokenBalance: this.state.makerTokenAvailableBalance,
      inputToken,
      inputTokenCode,
      inputAmount: parseInputAmount(inputAmount),
    })
  }

  hasError = () => {
    return !!this.props.error
  }

  inputAmountIsValid = (amount: BigNumber) => {
    const amountInMakerToken =
      this.state.inputToken === this.state.makerToken
        ? amount
        : this.getOppositeInputTokenAmount(amount.toString())
    return amountInMakerToken.isLessThanOrEqualTo(this.state.makerTokenAvailableBalance)
  }

  isExchangeInvalid = () => {
    const amount = parseInputAmount(this.state.inputAmount)
    const dollarAmount = this.isDollarInput()
      ? amount
      : this.getOppositeInputTokenAmount(this.state.inputAmount)

    const amountIsValid =
      !this.inputAmountIsValid(amount) ||
      dollarAmount.isLessThan(
        this.isDollarToGold() ? DOLLAR_TRANSACTION_MIN_AMOUNT : GOLD_TRANSACTION_MIN_AMOUNT
      )

    const exchangeRate = getRateForMakerToken(this.props.exchangeRatePair, this.state.makerToken)
    const exchangeRateIsInvalid = exchangeRate.isLessThanOrEqualTo(0)
    const takerToken = this.isDollarToGold() ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR
    const takerAmountIsInvalid = getTakerAmount(
      amount,
      exchangeRate,
      CURRENCIES[takerToken].displayDecimals
    ).isLessThanOrEqualTo(0)

    return amountIsValid || exchangeRateIsInvalid || takerAmountIsInvalid || this.hasError()
  }

  isDollarToGold = () => {
    return this.state.makerToken === CURRENCY_ENUM.DOLLAR
  }

  isDollarInput = () => {
    return this.state.inputToken === CURRENCY_ENUM.DOLLAR
  }

  getInputValue = () => {
    if (this.state.inputAmount) {
      return this.state.inputAmount
    } else {
      return ''
    }
  }

  getInputTokenDisplayText = () => {
    return this.isDollarInput() ? 'USD' : 'Gold'
  }

  getOppositeInputTokenDisplayText = () => {
    return this.isDollarInput() ? 'Gold' : 'USD'
  }

  getOppositeInputToken = () => {
    return this.isDollarInput() ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR
  }

  getOppositeInputTokenAmount = (amount: string) => {
    const exchangeRate = getRateForMakerToken(
      this.props.exchangeRatePair,
      this.state.makerToken,
      this.state.inputToken
    )
    const oppositeInputTokenAmount = getTakerAmount(amount, exchangeRate)
    return oppositeInputTokenAmount
  }

  switchInputToken = () => {
    this.setState({ inputToken: this.getOppositeInputToken() }, () => {
      this.updateError(this.state.inputAmount)
    })
  }

  getSubtotalDisplayValue = () => {
    return getMoneyDisplayValue(
      this.getOppositeInputTokenAmount(this.state.inputAmount),
      this.getOppositeInputToken(),
      true
    )
  }

  render() {
    const { t, exchangeRatePair } = this.props

    const exchangeRateDisplay = getRateForMakerToken(
      exchangeRatePair,
      this.state.makerToken,
      CURRENCY_ENUM.DOLLAR
    )

    return (
      <SafeAreaView
        // Force inset as this screen uses auto focus and KeyboardSpacer padding is initially
        // incorrect because of that
        forceInset={{ top: 'never', bottom: 'always' }}
        style={styles.container}
      >
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
              <View style={[styles.rowContainer, styles.goldInputRow]}>
                <View style={{ flexDirection: 'column' }}>
                  <Text style={[fontStyles.bodyBold, styles.exchangeBodyText]}>
                    {t('amount') + ` (${this.getInputTokenDisplayText()})`}
                  </Text>
                  <TouchableOpacity onPress={this.switchInputToken}>
                    <Text style={[fontStyles.subSmall, { textDecorationLine: 'underline' }]}>
                      {t('switchTo') + ' ' + this.getOppositeInputTokenDisplayText()}
                    </Text>
                  </TouchableOpacity>
                </View>
                <TextInput
                  autoFocus={true}
                  keyboardType={'decimal-pad'}
                  onChangeText={this.onChangeExchangeAmount}
                  value={this.getInputValue()}
                  placeholderTextColor={'#BDBDBD'}
                  placeholder={'0'}
                  style={[fontStyles.body, styles.currencyInputText]}
                />
              </View>
              <View style={styles.line} />
              <View style={styles.rowContainer}>
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>
                  {this.isDollarInput() ? t('global:celoGold') : t('subtotal')}
                  {` (@ ${getMoneyDisplayValue(exchangeRateDisplay, CURRENCY_ENUM.DOLLAR, true)})`}
                </Text>
                <Text style={fontStyles.regular}>{this.getSubtotalDisplayValue()}</Text>
              </View>
            </View>
          </KeyboardAwareScrollView>
        </View>

        <View style={componentStyles.bottomContainer}>
          <Button
            onPress={this.goToReview}
            text={t(`${Namespaces.walletFlow5}:review`)}
            accessibilityLabel={t('continue')}
            standard={false}
            disabled={this.isExchangeInvalid()}
            type={BtnTypes.PRIMARY}
          />
        </View>
        <KeyboardSpacer />
      </SafeAreaView>
    )
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      fetchExchangeRate,
      showError,
      hideAlert,
    }
  )(withNamespaces(Namespaces.exchangeFlow9)(ExchangeTradeScreen))
)

const styles = StyleSheet.create({
  line: {
    borderBottomColor: colors.darkLightest,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  exchangeBodyText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  currencyInputText: { fontSize: 24, lineHeight: 39, height: 54 }, // setting height manually b.c. of bug causing text to jump
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  rowContainer: { flexDirection: 'row', flex: 1, justifyContent: 'space-between' },
  goldInputRow: {
    marginTop: 38,
    alignItems: 'center',
  },
})
