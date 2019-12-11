import * as React from 'react'
import 'react-native'
import * as renderer from 'react-test-renderer'
import { escrowPaymentDouble } from 'src/escrow/__mocks__'
import EscrowedPaymentLineItem from 'src/escrow/EscrowedPaymentLineItem'

const mockedPayment = escrowPaymentDouble({})

it('renders correctly', () => {
  const tree = renderer.create(<EscrowedPaymentLineItem payment={mockedPayment} />)

  expect(tree).toMatchSnapshot()
})
