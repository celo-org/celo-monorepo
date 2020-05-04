import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { escrowPaymentDouble } from 'src/escrow/__mocks__'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'
import { createMockStore } from 'test/utils'

const mockedPayment = escrowPaymentDouble({})

it('renders correctly', () => {
  const store = createMockStore({})
  const tree = renderer.create(
    <Provider store={store}>
      <EscrowedPaymentLineItem payment={mockedPayment} />
    </Provider>
  )

  expect(tree).toMatchSnapshot()
})
