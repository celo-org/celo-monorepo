import * as React from 'react'
import 'react-native'
import { render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { Screens } from 'src/navigator/Screens'
import PaymentRequestUnavailable from 'src/paymentRequest/PaymentRequestUnavailable'
import { createMockStore, getMockStackScreenProps } from 'test/utils'
import { mockTransactionData } from 'test/values'

it('renders correctly', () => {
  const store = createMockStore()
  const mockScreenProps = getMockStackScreenProps(Screens.PaymentRequestUnavailable, {
    transactionData: mockTransactionData,
  })

  const tree = render(
    <Provider store={store}>
      <PaymentRequestUnavailable {...mockScreenProps} />
    </Provider>
  )

  expect(tree).toMatchSnapshot()
})
