import Button, { BtnSizes, BtnTypes } from '@celo/react-components/components/Button.v2'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import colors from '@celo/react-components/styles/colors.v2'
import fontStyles from '@celo/react-components/styles/fonts.v2'
import variables from '@celo/react-components/styles/variables'
import { parseInputAmount } from '@celo/utils/src/parsing'
import { StackScreenProps } from '@react-navigation/stack'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { getNumberFormatSettings } from 'react-native-localize'
import { SafeAreaView } from 'react-native-safe-area-context'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import { CeloExchangeEvents } from 'src/analytics/Events'
import ValoraAnalytics from 'src/analytics/ValoraAnalytics'
import { MoneyAmount } from 'src/apollo/types'
import { ErrorMessages } from 'src/app/ErrorMessages'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import LineItemRow from 'src/components/LineItemRow'
import { DOLLAR_TRANSACTION_MIN_AMOUNT, GOLD_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import {
  convertDollarsToLocalAmount,
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import { getLocalCurrencyCode, getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { StackParamList } from 'src/navigator/types'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'

const { decimalSeparator } = getNumberFormatSettings()

interface State {
  inputToken: CURRENCY_ENUM
  makerToken: CURRENCY_ENUM
  makerTokenAvailableBalance: string
  inputAmount: string
}

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  error: ErrorMessages | null
  localCurrencyCode: LocalCurrencyCode
  localCurrencyExchangeRate: string | null | undefined
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type OwnProps = StackScreenProps<StackParamList, Screens.ExchangeTradeScreen>

type Props = StateProps & DispatchProps & WithTranslation & OwnProps

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRatePair: state.exchange.exchangeRatePair,
  error: errorSelector(state),
  localCurrencyCode: getLocalCurrencyCode(state),
  localCurrencyExchangeRate: getLocalCurrencyExchangeRate(state),
})

export class ExchangeTradeScreen extends React.Component<Props, State> {
  state: State = {
    inputToken: CURRENCY_ENUM.GOLD,
    makerToken: CURRENCY_ENUM.DOLLAR,
    makerTokenAvailableBalance: '',
    inputAmount: '', // Raw amount entered, can be cGLD, cUSD or local currency
  }

  componentDidMount() {
    this.getMakerTokenPropertiesFromNavProps()
  }

  getMakerTokenPropertiesFromNavProps = () => {
    const { makerToken, makerTokenBalance } = this.props.route.params.makerTokenDisplay

    if (!makerToken) {
      throw new Error('Maker token missing from nav props')
    }

    if (!makerTokenBalance) {
      throw new Error('Maker token balance missing from nav props')
    }

    this.setState({
      makerToken,
      makerTokenAvailableBalance: makerTokenBalance,
    })
    this.props.fetchExchangeRate(makerToken, new BigNumber(makerTokenBalance))
  }

  onChangeExchangeAmount = (amount: string) => {
    this.setState({ inputAmount: amount }, () => {
      this.updateError()
    })
  }

  updateError = () => {
    const tokenAmount = this.getInputTokenAmount()
    if (!this.inputAmountIsValid(tokenAmount)) {
      this.props.showError(
        this.isDollarToGold() ? ErrorMessages.NSF_DOLLARS : ErrorMessages.NSF_GOLD
      )
    } else {
      this.props.hideAlert()
    }
  }

  goToReview = () => {
    const { inputToken } = this.state
    const inputTokenDisplayName = this.getInputTokenDisplayText()
    const inputAmount = this.getInputTokenAmount()
    // BEGIN: Analytics
    const goldToDollarExchangeRate = getRateForMakerToken(
      this.props.exchangeRatePair,
      this.state.makerToken,
      CURRENCY_ENUM.DOLLAR
    )
    const goldAmount = this.isDollarToGold()
      ? this.getOppositeInputTokenAmount(inputAmount)
      : inputAmount
    const dollarsAmount = this.isDollarToGold()
      ? inputAmount
      : this.getOppositeInputTokenAmount(inputAmount)
    const localCurrencyAmount = convertDollarsToLocalAmount(
      dollarsAmount,
      this.props.localCurrencyExchangeRate
    )
    ValoraAnalytics.track(
      this.isDollarToGold()
        ? CeloExchangeEvents.celo_buy_continue
        : CeloExchangeEvents.celo_sell_continue,
      {
        localCurrencyAmount: localCurrencyAmount ? localCurrencyAmount.toString() : null,
        goldAmount: goldAmount.toString(),
        inputToken,
        goldToDollarExchangeRate: goldToDollarExchangeRate.toString(),
      }
    )
    // END: Analytics
    navigate(Screens.ExchangeReview, {
      exchangeInput: {
        makerToken: this.state.makerToken,
        makerTokenBalance: this.state.makerTokenAvailableBalance,
        inputToken,
        inputTokenDisplayName,
        inputAmount,
      },
    })
  }

  hasError = () => {
    return !!this.props.error
  }

  inputAmountIsValid = (tokenAmount: BigNumber) => {
    const amountInMakerToken =
      this.state.inputToken === this.state.makerToken
        ? tokenAmount
        : this.getOppositeInputTokenAmount(tokenAmount)
    return amountInMakerToken.isLessThanOrEqualTo(this.state.makerTokenAvailableBalance)
  }

  isExchangeInvalid = () => {
    const tokenAmount = this.getInputTokenAmount()

    const amountIsInvalid =
      !this.inputAmountIsValid(tokenAmount) ||
      tokenAmount.isLessThan(
        this.isDollarInput() ? DOLLAR_TRANSACTION_MIN_AMOUNT : GOLD_TRANSACTION_MIN_AMOUNT
      )

    const exchangeRate = getRateForMakerToken(this.props.exchangeRatePair, this.state.makerToken)
    const exchangeRateIsInvalid = exchangeRate.isLessThanOrEqualTo(0)
    const takerToken = this.isDollarToGold() ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR
    const takerAmountIsInvalid = getTakerAmount(
      tokenAmount,
      exchangeRate,
      CURRENCIES[takerToken].displayDecimals
    ).isLessThanOrEqualTo(0)

    return amountIsInvalid || exchangeRateIsInvalid || takerAmountIsInvalid || this.hasError()
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

  // Output is either cGLD or cUSD based on input token
  // Local amounts are converted to cUSD
  getInputTokenAmount = () => {
    const parsedInputAmount = parseInputAmount(this.state.inputAmount, decimalSeparator)

    if (this.state.inputToken === CURRENCY_ENUM.GOLD) {
      return parsedInputAmount
    }

    const { localCurrencyExchangeRate } = this.props

    const dollarsAmount =
      convertLocalAmountToDollars(parsedInputAmount, localCurrencyExchangeRate) || new BigNumber('')

    return convertDollarsToMaxSupportedPrecision(dollarsAmount)
  }

  getInputTokenDisplayText = () => {
    return this.isDollarInput() ? this.props.localCurrencyCode : this.props.t('global:gold')
  }

  getOppositeInputTokenDisplayText = () => {
    return this.isDollarInput() ? this.props.t('global:gold') : this.props.localCurrencyCode
  }

  getOppositeInputToken = () => {
    return this.isDollarInput() ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR
  }

  getOppositeInputTokenAmount = (tokenAmount: BigNumber) => {
    const exchangeRate = getRateForMakerToken(
      this.props.exchangeRatePair,
      this.state.makerToken,
      this.state.inputToken
    )
    const oppositeInputTokenAmount = getTakerAmount(tokenAmount, exchangeRate)
    return oppositeInputTokenAmount
  }

  switchInputToken = () => {
    const inputToken = this.getOppositeInputToken()
    ValoraAnalytics.track(CeloExchangeEvents.celo_toggle_input_currency, {
      to: inputToken,
    })
    this.setState({ inputToken }, () => {
      this.updateError()
    })
  }

  getSubtotalAmount = (): MoneyAmount => {
    return {
      value: this.getOppositeInputTokenAmount(this.getInputTokenAmount()),
      currencyCode: CURRENCIES[this.getOppositeInputToken()].code,
    }
  }

  render() {
    const { t, exchangeRatePair } = this.props

    const exchangeRateDisplay = getRateForMakerToken(
      exchangeRatePair,
      this.state.makerToken,
      CURRENCY_ENUM.DOLLAR
    )

    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
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
              <TouchableOpacity onPress={this.switchInputToken} testID="ExchangeSwitchInput">
                <Text style={styles.switchToText}>
                  {t('switchTo', { tokenName: this.getOppositeInputTokenDisplayText() })}
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              autoFocus={true}
              keyboardType={'decimal-pad'}
              onChangeText={this.onChangeExchangeAmount}
              value={this.getInputValue()}
              placeholderTextColor={colors.gray3}
              placeholder={'0'}
              style={styles.currencyInput}
              testID="ExchangeInput"
            />
          </View>
          <LineItemRow
            textStyle={styles.subtotalBodyText}
            title={
              <Trans
                i18nKey="inputSubtotal"
                tOptions={{ context: this.isDollarInput() ? 'gold' : null }}
                ns={Namespaces.exchangeFlow9}
              >
                Subtotal @{' '}
                <CurrencyDisplay
                  amount={{
                    value: exchangeRateDisplay,
                    currencyCode: CURRENCIES[CURRENCY_ENUM.DOLLAR].code,
                  }}
                />
              </Trans>
            }
            amount={<CurrencyDisplay amount={this.getSubtotalAmount()} />}
          />
        </KeyboardAwareScrollView>
        <Button
          onPress={this.goToReview}
          text={t(`global:review`)}
          accessibilityLabel={t('continue')}
          disabled={this.isExchangeInvalid()}
          type={BtnTypes.SECONDARY}
          size={BtnSizes.FULL}
          style={styles.reviewBtn}
          testID="ExchangeReviewButton"
        />
        <KeyboardSpacer />
      </SafeAreaView>
    )
  }
}

export default connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
  fetchExchangeRate,
  showError,
  hideAlert,
})(withTranslation<Props>(Namespaces.exchangeFlow9)(ExchangeTradeScreen))

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
    marginBottom: 8,
  },
  exchangeBodyText: {
    ...fontStyles.regular500,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '700',
  },
  subtotalBodyText: {
    ...fontStyles.small,
  },
  switchToText: {
    ...fontStyles.small,
    fontSize: 13,
    textDecorationLine: 'underline',
    color: colors.gray4,
    marginTop: 4,
  },
  currencyInput: {
    ...fontStyles.regular,
    marginLeft: 10,
    flex: 1,
    textAlign: 'right',
    fontSize: 24,
    lineHeight: Platform.select({ android: 39, ios: 30 }), // vertical align = center
    height: 60, // setting height manually b.c. of bug causing text to jump on Android
    color: colors.goldDark,
  },
  reviewBtn: {
    padding: variables.contentPadding,
  },
})
