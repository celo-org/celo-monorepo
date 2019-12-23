import Button, { BtnTypes } from '@celo/react-components/components/Button'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { parseInputAmount } from '@celo/utils/src/parsing'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
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
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { exchangeHeader } from 'src/navigator/Headers'
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
  makerTokenDisplay: {
    makerToken: CURRENCY_ENUM
    makerTokenBalance: string
  }
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & NavigationInjectedProps & WithTranslation

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRatePair: state.exchange.exchangeRatePair,
  error: errorSelector(state),
})

export class ExchangeTradeScreen extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavProps>) => {
    const { makerToken, makerTokenBalance } = navigation.getParam('makerTokenDisplay')
    return {
      ...exchangeHeader(makerToken, makerTokenBalance),
    }
  }

  state: State = {
    inputToken: CURRENCY_ENUM.GOLD,
    makerToken: CURRENCY_ENUM.DOLLAR,
    makerTokenAvailableBalance: '',
    inputAmount: '',
  }

  getMakerTokenPropertiesFromNavProps() {
    const { makerToken, makerTokenBalance } = this.props.navigation.getParam('makerTokenDisplay')
    if (!makerToken || !makerTokenBalance) {
      throw new Error('Maker token or maker token balance missing from nav props')
    }
    this.setState({
      makerToken,
      makerTokenAvailableBalance: makerTokenBalance,
    })
    this.props.fetchExchangeRate(makerToken, makerTokenBalance)
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
    const inputTokenDisplayName = this.getInputTokenDisplayText()
    navigate(Screens.ExchangeReview, {
      exchangeInput: {
        makerToken: this.state.makerToken,
        makerTokenBalance: this.state.makerTokenAvailableBalance,
        inputToken,
        inputTokenDisplayName,
        inputAmount: parseInputAmount(inputAmount),
      },
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
    return this.isDollarInput() ? 'USD' : this.props.t('global:gold')
  }

  getOppositeInputTokenDisplayText = () => {
    return this.isDollarInput() ? this.props.t('global:gold') : 'USD'
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
        <DisconnectBanner />
        <KeyboardAwareScrollView
          keyboardShouldPersistTaps={'always'}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.amountInputContainer}>
            <View>
              <Text style={styles.exchangeBodyText}>
                {t('exchangeAmount', { tokenName: this.getInputTokenDisplayText() })}
              </Text>
              <TouchableOpacity onPress={this.switchInputToken}>
                <Text style={[fontStyles.subSmall, { textDecorationLine: 'underline' }]}>
                  {t('switchTo', { tokenName: this.getOppositeInputTokenDisplayText() })}
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
              style={styles.currencyInput}
            />
          </View>
          <HorizontalLine />
          {/* <View style={styles.line} /> */}
          <View style={styles.subtotalContainer}>
            <Text style={styles.exchangeBodyText}>
              {t('inputSubtotal', {
                goldOrSubtotal: this.isDollarInput() ? t('global:celoGold') : t('subtotal'),
                rate: getMoneyDisplayValue(exchangeRateDisplay, CURRENCY_ENUM.DOLLAR, true),
              })}
            </Text>
            <Text style={styles.subtotal}>{this.getSubtotalDisplayValue()}</Text>
          </View>
        </KeyboardAwareScrollView>
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
  )(withTranslation(Namespaces.exchangeFlow9)(ExchangeTradeScreen))
)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  contentContainer: {
    paddingHorizontal: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    marginTop: 38,
    alignItems: 'center',
  },
  exchangeBodyText: {
    ...fontStyles.bodyBold,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  currencyInput: {
    ...fontStyles.body,
    marginLeft: 10,
    flex: 1,
    textAlign: 'right',
    fontSize: 24,
    lineHeight: 39,
    height: 54, // setting height manually b.c. of bug causing text to jump on Android
  },
  subtotalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  subtotal: {
    ...fontStyles.regular,
    marginLeft: 10,
  },
})
