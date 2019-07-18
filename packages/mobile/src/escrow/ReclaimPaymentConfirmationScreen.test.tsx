import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import ReclaimPaymentConfirmationScreen from 'src/escrow/ReclaimPaymentConfirmationScreen'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockAccount, mockAccount2, mockContactWithPhone } from 'test/values'

const store = createMockStore()

describe('ReclaimPaymentConfirmationScreen', () => {
  it('renders correctly', () => {
    const navigation = createMockNavigationProp({
      senderAddress: mockAccount2,
      recipient: mockContactWithPhone,
      paymentID: mockAccount,
      currency: SHORT_CURRENCIES.DOLLAR,
      amount: new BigNumber(10),
      timestamp: new BigNumber(10000),
      expirySeconds: new BigNumber(50000),
    })

    const tree = renderer.create(
      <Provider store={store}>
        <ReclaimPaymentConfirmationScreen navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
