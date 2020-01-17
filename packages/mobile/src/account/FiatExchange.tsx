import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { headerWithBackButton } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'

const moonpayUri = 'https://buy-staging.moonpay.io/'
const apiKey = 'pk_test_EDT0SRJUlsJezJUFGaVZIr8LuaTsF5NO' // TODO production api key when actually buying cUSD
const currencyCode = 'ETH' // TODO switch to cUSD when added to Moonpay
const moonpaySupportedCurrencies = ['USD', 'EUR', 'GBP']

const moonpayBuyEth = moonpayUri + '?apiKey=' + apiKey + '&currencyCode=' + currencyCode

interface StateProps {
  account: string | null
  currencyCode: LocalCurrencyCode
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    account: state.web3.account,
    currencyCode: state.localCurrency.preferredCurrencyCode || LocalCurrencyCode.USD,
  }
}

type Props = StateProps & WithTranslation

class FiatExchange extends React.Component<Props> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:licenses'),
  })

  render() {
    const moonpayCurrencyCode = moonpaySupportedCurrencies.includes(this.props.currencyCode)
      ? this.props.currencyCode
      : LocalCurrencyCode.USD // Default to USD if fiat currency not supported by moonpay
    const moonpayLink =
      moonpayBuyEth +
      '&walletAddress=' +
      this.props.account +
      '&baseCurrencyCode=' +
      moonpayCurrencyCode
    return <WebView style={styles.exchangeWebView} source={{ uri: moonpayLink }} />
  }
}

const styles = StyleSheet.create({
  exchangeWebView: {
    marginHorizontal: 20,
  },
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.accountScreen10)(FiatExchange)
)
