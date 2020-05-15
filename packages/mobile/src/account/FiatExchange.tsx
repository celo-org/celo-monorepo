import colors from '@celo/react-components/styles/colors'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { ActivityIndicator, StyleSheet } from 'react-native'
import { WebView } from 'react-native-webview'
import { connect } from 'react-redux'
import { showError } from 'src/alert/actions'
import { ErrorMessages } from 'src/app/ErrorMessages'
import i18n, { Namespaces, withTranslation } from 'src/i18n'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode } from 'src/localCurrency/selectors'
import { headerWithBackButton } from 'src/navigator/Headers'
import { RootState } from 'src/redux/reducers'

interface State {
  signedUrl: string
}

interface StateProps {
  localCurrency: LocalCurrencyCode
  account: string | null
}

const mapStateToProps = (state: RootState): StateProps => {
  return {
    localCurrency: getLocalCurrencyCode(state),
    account: state.web3.account,
  }
}

type Props = StateProps & WithTranslation

const celoCurrencyCode = 'CUSD'
const signMoonpayFirebaseUrl = 'https://us-central1-celo-org-mobile.cloudfunctions.net/signMoonpay'

async function signMoonpayUrl(account: string, localCurrencyCode: LocalCurrencyCode) {
  const response = await fetch(signMoonpayFirebaseUrl, {
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
  })
  const json = await response.json()
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

  updateMoonpayUrl = async () => {
    if (this.props.account) {
      try {
        const signedUrl = await signMoonpayUrl(this.props.account, this.props.localCurrency)
        this.setState({ signedUrl })
      } catch {
        this.handleError()
      }
    }
  }

  async componentDidMount() {
    await this.updateMoonpayUrl()
  }

  handleError = () => {
    showError(ErrorMessages.FIREBASE_FAILED)
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
