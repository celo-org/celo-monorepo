import { CURRENCY_ENUM } from '@celo/utils'
import * as React from 'react'
import { render } from 'react-native-testing-library'
import { WebView } from 'react-native-webview'
import { Provider } from 'react-redux'
import BidaliScreen from 'src/fiatExchanges/BidaliScreen'
import { Screens } from 'src/navigator/Screens'
import { createMockStore, getMockStackScreenProps } from 'test/utils'

// tslint:disable no-eval

const mockScreenProps = getMockStackScreenProps(Screens.BidaliScreen, {
  currency: CURRENCY_ENUM.DOLLAR,
})

declare global {
  interface Window {
    valora: any
  }
}

describe(BidaliScreen, () => {
  beforeEach(() => {
    // Reset injected JS effect
    window.valora = undefined
  })

  it('renders correctly when no phone number is provided', () => {
    const mockStore = createMockStore({
      account: { e164PhoneNumber: null },
      stableToken: { balance: '10' },
    })

    const { getByType } = render(
      <Provider store={mockStore}>
        <BidaliScreen {...mockScreenProps} />
      </Provider>
    )

    const webView = getByType(WebView)
    expect(webView).toBeDefined()
    expect(eval(webView.props.injectedJavaScriptBeforeContentLoaded)).toBe(true)
    expect(window.valora).toMatchInlineSnapshot(`
      Object {
        "balances": Object {
          "CUSD": "10",
        },
        "onPaymentRequest": [Function],
        "openUrl": [Function],
        "paymentCurrency": "CUSD",
        "phoneNumber": null,
      }
    `)
  })

  it('renders correctly when a phone number is provided', () => {
    const mockStore = createMockStore({
      account: { e164PhoneNumber: '+14155556666' },
      stableToken: { balance: '10' },
    })

    const { getByType } = render(
      <Provider store={mockStore}>
        <BidaliScreen {...mockScreenProps} />
      </Provider>
    )
    const webView = getByType(WebView)
    expect(webView).toBeDefined()
    expect(eval(webView.props.injectedJavaScriptBeforeContentLoaded)).toBe(true)
    expect(window.valora).toMatchInlineSnapshot(`
      Object {
        "balances": Object {
          "CUSD": "10",
        },
        "onPaymentRequest": [Function],
        "openUrl": [Function],
        "paymentCurrency": "CUSD",
        "phoneNumber": "+14155556666",
      }
    `)
  })
})
