import Button, { BtnTypes } from '@celo/react-components/components/Button'
import KeyboardAwareScrollView from '@celo/react-components/components/KeyboardAwareScrollView'
import KeyboardSpacer from '@celo/react-components/components/KeyboardSpacer'
import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { iconHitslop } from '@celo/react-components/styles/variables'
import { parseInputAmount } from '@celo/utils/src/parsing'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import SafeAreaView from 'react-native-safe-area-view'
import { connect } from 'react-redux'
import { hideAlert, showError } from 'src/alert/actions'
import { errorSelector } from 'src/alert/reducer'
import CeloAnalytics from 'src/analytics/CeloAnalytics'
import { CustomEventNames, DefaultEventNames } from 'src/analytics/constants'
import componentWithAnalytics from 'src/analytics/wrapper'
import { ErrorMessages } from 'src/app/ErrorMessages'
import { DOLLAR_TRANSACTION_MIN_AMOUNT, GOLD_TRANSACTION_MIN_AMOUNT } from 'src/config'
import { fetchExchangeRate } from 'src/exchange/actions'
import ExchangeRate from 'src/exchange/ExchangeRate'
import { ExchangeRatePair } from 'src/exchange/reducer'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import i18n, { Namespaces } from 'src/i18n'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate, navigateBack } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import SwapIcon from 'src/shared/SwapIcon'
import {
  getNewTakerBalance,
  getRateForMakerToken,
  getTakerAmount,
} from 'src/utils/currencyExchange'
import { getMoneyDisplayValue } from 'src/utils/formatting'

interface State {
  makerToken: CURRENCY_ENUM
  makerTokenAmount: string
}

interface StateProps {
  exchangeRatePair: ExchangeRatePair | null
  dollarBalance: string | null
  goldBalance: string | null
  error: ErrorMessages | null
}

interface DispatchProps {
  fetchExchangeRate: typeof fetchExchangeRate
  showError: typeof showError
  hideAlert: typeof hideAlert
}

type Props = StateProps & DispatchProps & WithNamespaces

const mapStateToProps = (state: RootState): StateProps => ({
  exchangeRatePair: state.exchange.exchangeRatePair,
  goldBalance: state.goldToken.balance,
  dollarBalance: state.stableToken.balance,
  error: errorSelector(state),
})

export class ExchangeTradeScreen extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithCancelButton,
    headerTitle: i18n.t(`${Namespaces.exchangeFlow9}:exchange`),
  })

  state = {
    makerToken: CURRENCY_ENUM.DOLLAR,
    makerTokenAmount: '',
  }

  componentDidMount() {
    this.props.fetchExchangeRate()
  }

  onPressSwapIcon = () => {
    const makerToken =
      this.state.makerToken === CURRENCY_ENUM.DOLLAR ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR
    this.setState({ makerToken }, () => {
      this.updateError(this.state.makerTokenAmount)
    })
    CeloAnalytics.track(CustomEventNames.currency_swap)
  }

  onChangeExchangeAmount = (amount: string) => {
    // remove $ we inserted for display purposes
    const currencySymbol = new RegExp('\\' + CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol, 'g')
    amount = amount.replace(currencySymbol, '')

    this.setState({ makerTokenAmount: amount }, () => {
      this.updateError(amount)
    })
  }

  updateError(amount: string) {
    if (this.getMakerBalance().isLessThan(amount)) {
      this.props.showError(
        this.isDollarToGold() ? ErrorMessages.NSF_DOLLARS : ErrorMessages.NSF_GOLD
      )
    } else {
      this.props.hideAlert()
    }
  }

  onEndEditing = () => {
    CeloAnalytics.track(
      this.state.makerToken === CURRENCY_ENUM.DOLLAR
        ? CustomEventNames.exchange_dollar_input
        : CustomEventNames.exchange_gold_input,
      { exchangeInputAmount: this.state.makerTokenAmount }
    )
  }

  onInputFocus = () => {
    const { exchangeRatePair, dollarBalance, goldBalance, error } = this.props
    CeloAnalytics.track(DefaultEventNames.fieldFocused, {
      exchangeRatePair,
      dollarBalance,
      goldBalance,
      error,
      label: 'Exchange Amount',
    })
  }

  goBack = () => {
    this.props.hideAlert()
    navigateBack()
  }

  goToReview = () => {
    const { makerToken, makerTokenAmount } = this.state
    CeloAnalytics.track(CustomEventNames.exchange_continue)
    navigate(Screens.ExchangeReview, {
      confirmationInput: { makerToken, makerAmount: parseInputAmount(makerTokenAmount) },
    })
  }

  getNewTakerBalance = (takerTokenAmount: BigNumber) => {
    const { dollarBalance, goldBalance } = this.props
    return this.isDollarToGold()
      ? getNewTakerBalance(goldBalance, takerTokenAmount)
      : getNewTakerBalance(dollarBalance, takerTokenAmount)
  }

  hasError = () => {
    return !!this.props.error
  }

  isExchangeInvalid = () => {
    const makerBalance = this.getMakerBalance()
    const amount = parseInputAmount(this.state.makerTokenAmount)
    const amountIsInvalid =
      amount.isGreaterThan(makerBalance) ||
      amount.isLessThan(
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

    return amountIsInvalid || exchangeRateIsInvalid || takerAmountIsInvalid || this.hasError()
  }

  getMakerBalance = () => {
    return new BigNumber(
      (this.isDollarToGold() ? this.props.dollarBalance : this.props.goldBalance) || 0
    )
  }

  isDollarToGold = () => {
    return this.state.makerToken === CURRENCY_ENUM.DOLLAR
  }

  getInputValue = () => {
    if (this.state.makerTokenAmount) {
      return CURRENCIES[this.state.makerToken].symbol + this.state.makerTokenAmount
    } else {
      return ''
    }
  }

  getMakerTakerProps = () => {
    const { t } = this.props
    const dollarProps = {
      token: CURRENCY_ENUM.DOLLAR,
      tokenText: t('global:celoDollars') + ' (cUSD)',
      style: styles.green,
      symbol: CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol,
    }
    const goldProps = {
      token: CURRENCY_ENUM.GOLD,
      tokenText: t('global:celoGold') + ' (cGLD)',
      style: styles.gold,
      symbol: CURRENCIES[CURRENCY_ENUM.GOLD].symbol,
    }

    if (this.isDollarToGold()) {
      return {
        maker: dollarProps,
        taker: goldProps,
        placeholderColor: colors.celoGreenInactive,
      }
    } else {
      return {
        maker: goldProps,
        taker: dollarProps,
        placeholderColor: colors.celoGoldInactive,
      }
    }
  }

  render() {
    const { makerTokenAmount } = this.state
    const { t } = this.props

    const { maker, taker, placeholderColor } = this.getMakerTakerProps()
    const makerBalance = this.getMakerBalance()
    const exchangeRate = getRateForMakerToken(this.props.exchangeRatePair, maker.token)
    const takerTokenAmount = getTakerAmount(parseInputAmount(makerTokenAmount), exchangeRate)
    const newTakerBalance = this.getNewTakerBalance(takerTokenAmount)

    const borderStyle = { borderColor: this.hasError() ? colors.errorRed : colors.dark }

    return (
      <SafeAreaView
        // Force inset as this screen uses auto focus and KeyboardSpacer padding is initially
        // incorrect because of that
        forceInset={{ top: 'never', bottom: 'always' }}
        style={styles.container}
      >
        <DisconnectBanner />
        <KeyboardAwareScrollView keyboardShouldPersistTaps={'always'}>
          <View style={styles.transferArea}>
            <View style={styles.transferInfo}>
              <Text style={[styles.currencyLabel, fontStyles.bodySmall]}>{maker.tokenText}</Text>
              <TextInput
                autoFocus={true}
                caretHidden={false}
                maxLength={11}
                keyboardType={'decimal-pad'}
                onChangeText={this.onChangeExchangeAmount}
                onEndEditing={this.onEndEditing}
                onFocus={this.onInputFocus}
                value={this.getInputValue()}
                placeholderTextColor={placeholderColor}
                placeholder={maker.symbol + '0'}
                underlineColorAndroid={'transparent'}
                style={[
                  styles.amountText,
                  fontStyles.regular,
                  maker.style,
                  styles.ioBox,
                  styles.inputBox,
                  borderStyle,
                ]}
              />
              <View style={styles.transferMeta}>
                <Text style={fontStyles.bodySmall}>{t('available')} </Text>
                <Text numberOfLines={1} style={[fontStyles.bodySmallBold, maker.style]}>
                  {getMoneyDisplayValue(makerBalance, maker.token, true)}
                </Text>
              </View>
            </View>
            <Touchable
              style={styles.exchangeButtonBackground}
              borderless={true}
              onPress={this.onPressSwapIcon}
              hitSlop={iconHitslop}
            >
              <SwapIcon size={50} />
            </Touchable>
            <View style={styles.transferInfo}>
              <Text style={[styles.currencyLabel, fontStyles.bodySmall]}>{taker.tokenText}</Text>
              <View style={styles.ioBox}>
                <View style={styles.outputText}>
                  <Text
                    numberOfLines={1}
                    style={[styles.amountText, fontStyles.regular, taker.style]}
                  >
                    {getMoneyDisplayValue(takerTokenAmount, taker.token, true)}
                  </Text>
                  <Text
                    style={[styles.amountText, fontStyles.regular, taker.style, styles.superscript]}
                  >
                    *
                  </Text>
                </View>
              </View>
              <View style={styles.transferMeta}>
                <Text style={fontStyles.bodySmall}>{t('newBalance')} </Text>
                <Text numberOfLines={1} style={[fontStyles.bodySmallBold, taker.style]}>
                  {getMoneyDisplayValue(newTakerBalance, taker.token, true)}
                </Text>
              </View>
            </View>
          </View>
          <ExchangeRate
            rate={exchangeRate}
            makerToken={this.state.makerToken}
            showFinePrint={true}
          />
        </KeyboardAwareScrollView>
        <View style={componentStyles.bottomContainer}>
          <Button
            onPress={this.goToReview}
            text={t('continue')}
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
  container: {
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'space-between',
  },
  transferArea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 15,
  },
  transferInfo: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
  },
  transferMeta: {
    alignItems: 'center',
  },
  currencyLabel: {
    color: colors.darkSecondary,
  },
  exchangeButtonBackground: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 15,
    marginVertical: 15 + 18,
  },
  amountText: {
    fontSize: 22,
  },
  ioBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    width: '100%',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 22,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 3,
    paddingTop: 15,
    paddingBottom: 10,
    height: 54, // setting height manually b.c. of bug causing text to jump
  },
  outputText: {
    paddingTop: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
    height: 22,
  },
  superscript: {
    fontSize: 12,
    lineHeight: 16,
  },
  green: { color: colors.celoGreen },
  gold: { color: colors.celoGold },
})
