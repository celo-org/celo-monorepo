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
import { StyleSheet, Text, TextInput, View } from 'react-native'
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
import i18n, { Namespaces } from 'src/i18n'
import { headerWithCancelButton } from 'src/navigator/Headers'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import { RootState } from 'src/redux/reducers'
import DisconnectBanner from 'src/shared/DisconnectBanner'
import { getRateForMakerToken, getTakerAmount } from 'src/utils/currencyExchange'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import { TouchableOpacity } from 'react-native-gesture-handler'

interface State {
  inputToken: CURRENCY_ENUM
  makerToken: CURRENCY_ENUM
  makerTokenAvailableBalance: string
  goldAmount: string
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

export class ExchangeBuyScreen extends React.Component<Props, State> {
  static navigationOptions = ({ navigation }: NavigationInjectedProps<NavProps>) => {
    const makerToken = navigation.getParam('makerToken')
    const title = makerToken === CURRENCY_ENUM.DOLLAR ? 'Buy Gold' : 'Sell Gold' // TODO(anna) translate
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
    inputToken: CURRENCY_ENUM.GOLD,
    makerToken: CURRENCY_ENUM.DOLLAR,
    makerTokenAvailableBalance: '',
    goldAmount: '',
  }

  getMakerTokenPropertiesFromNavProps(): {
    makerToken: CURRENCY_ENUM
    makerTokenAvailableBalance: string
  } {
    const makerToken = this.props.navigation.getParam('makerToken')
    const makerTokenAvailableBalance = this.props.navigation.getParam('makerTokenBalance')
    if (!makerToken || !makerTokenAvailableBalance) {
      throw new Error('Maker token or maker token balance missing from nav props')
    }
    return { makerToken, makerTokenAvailableBalance }
  }

  componentDidMount() {
    this.props.fetchExchangeRate()
    const { makerToken, makerTokenAvailableBalance } = this.getMakerTokenPropertiesFromNavProps()
    this.setState({
      makerToken,
      makerTokenAvailableBalance,
    })
  }

  onChangeExchangeAmount = (amount: string) => {
    this.setState({ goldAmount: amount })
  }

  updateError(amount: string) {
    if (new BigNumber(amount).isGreaterThan(this.state.makerTokenAvailableBalance)) {
      this.props.showError(
        this.isDollarToGold() ? ErrorMessages.NSF_DOLLARS : ErrorMessages.NSF_GOLD
      )
    } else {
      this.props.hideAlert()
    }
  }

  getDollarAmount = () => {
    const exchangeRate = getRateForMakerToken(this.props.exchangeRatePair, CURRENCY_ENUM.GOLD)
    const dollarAmount = getTakerAmount(parseInputAmount(this.state.goldAmount), exchangeRate)
    return dollarAmount.toString()
  }

  goToReview = () => {
    const { makerToken, goldAmount } = this.state
    const makerAmount = this.isDollarToGold() ? this.getDollarAmount() : goldAmount
    navigate(Screens.ExchangeReview, {
      confirmationInput: { makerToken, makerAmount: parseInputAmount(makerAmount) },
    })
  }

  hasError = () => {
    return !!this.props.error
  }

  isExchangeInvalid = () => {
    const amount = parseInputAmount(this.state.goldAmount)
    const amountIsInvalid =
      amount.isGreaterThan(this.state.makerTokenAvailableBalance) ||
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

  isDollarToGold = () => {
    return this.state.makerToken === CURRENCY_ENUM.DOLLAR
  }

  getInputValue = () => {
    if (this.state.goldAmount) {
      return this.state.goldAmount
    } else {
      return ''
    }
  }

  isDollarInput = () => {
    return this.state.inputToken === CURRENCY_ENUM.DOLLAR
  }

  getInputTokenDisplayText = () => {
    return this.isDollarInput() ? 'USD' : 'Gold'
  }

  getOppositeInputTokenDisplayText = () => {
    return this.isDollarInput() ? 'Gold' : 'USD'
  }

  switchInputToken = () => {
    this.setState({ inputToken: this.isDollarInput() ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR })
  }

  render() {
    const { t, exchangeRatePair } = this.props

    const exchangeRateDisplay = getRateForMakerToken(exchangeRatePair, CURRENCY_ENUM.DOLLAR) // Always show rate in dollars
    const subtotal = this.getDollarAmount()

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
                <Text style={[fontStyles.body, styles.exchangeBodyText]}>
                  Amount ({this.getInputTokenDisplayText()})
                </Text>
                <TouchableOpacity onPress={this.switchInputToken}>
                  <Text style={[fontStyles.body, styles.exchangeBodyText]}>
                    Switch to ({this.getInputTokenDisplayText()})
                  </Text>
                </TouchableOpacity>
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
                  {`Subtotal (@ ${getMoneyDisplayValue(
                    exchangeRateDisplay,
                    CURRENCY_ENUM.DOLLAR,
                    true
                  )})`}
                </Text>
                <Text style={fontStyles.regular}>
                  {getMoneyDisplayValue(subtotal, CURRENCY_ENUM.DOLLAR, true)}
                </Text>
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
  )(withNamespaces(Namespaces.exchangeFlow9)(ExchangeBuyScreen))
)

const styles = StyleSheet.create({
  headerTextContainer: { flex: 1, alignSelf: 'center', alignItems: 'center' },
  line: {
    borderBottomColor: colors.darkLightest,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  exchangeBodyText: { fontSize: 15, lineHeight: 20 },
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
