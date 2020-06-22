import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import MoonPay from 'src/fiatExchanges/MoonPay'
import { createMockStore } from 'test/utils'

describe('MoonPay', () => {
  const store = createMockStore()
  it('renders correctly', () => {
    const { toJSON } = render(
      <Provider store={store}>
        <MoonPay />
      </Provider>
    )
    expect(toJSON()).toMatchSnapshot()
  })
})
