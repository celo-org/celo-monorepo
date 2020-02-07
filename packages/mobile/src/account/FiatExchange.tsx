import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { headerWithBackButton } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'
import Logger from 'src/utils/Logger'

interface State {
  signedUrl: string
}

interface StateProps {
  url: string
  localCurrency: LocalCurrencyCode
  account: string | null
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    url: state.account.moonpayUrl,
    localCurrency: state.localCurrency.preferredCurrencyCode || LocalCurrencyCode.USD,
    account: state.web3.account,
  }
}

type Props = StateProps & WithTranslation

const celoCurrencyCode = 'ETH' // TODO switch to cUSD when added to Moonpay

async function signMoonpayUrl(account: string, localCurrencyCode: LocalCurrencyCode) {
  const response = await fetch(
    'https://us-central1-celo-org-mobile.cloudfunctions.net/signMoonpay',
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: celoCurrencyCode,
        address: account,
        fiatCurrency: localCurrencyCode,
      }),
    }
  )
  const json = await response.json()
  Logger.debug('response', JSON.stringify(json))
  Logger.debug('response url: ', json.url)
  return json.url
}

class FiatExchange extends React.Component<Props, State> {
  static navigationOptions = () => ({
    ...headerWithBackButton,
    headerTitle: i18n.t('accountScreen10:addFunds'),
  })

  state: State = {
    signedUrl: '',
  }

  componentDidMount() {
    if (this.props.account) {
      signMoonpayUrl(this.props.account, this.props.localCurrency)
        .then((signedUrl) => this.setState({ signedUrl }))
        .catch((err) => this.handleError(err))
    } // TODO(anna) handle account that hasn't been made yet
  }

  handleError = (error: Error) => {
    // TODO(anna) handleError
  }

  render() {
    return this.state.signedUrl === '' ? (
      <ActivityIndicator size="large" color={colors.celoGreen} />
    ) : (
      <WebView style={styles.exchangeWebView} source={{ uri: this.state.signedUrl }} />
    )
  }
}

const styles = StyleSheet.create({
  exchangeWebView: {},
})

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(
  withTranslation(Namespaces.accountScreen10)(FiatExchange)
)
