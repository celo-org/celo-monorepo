import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import RequestConfirmation from 'src/send/RequestConfirmation'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockAccount, mockAccount2, mockE164Number, mockRecipient } from 'test/values'

const store = createMockStore({
  account: {
    e164PhoneNumber: mockE164Number,
  },
  web3: {
    account: mockAccount2,
  },
})

describe('RequestConfirmation', () => {
  it('renders correctly for request payment confirmation', () => {
    const navigation = createMockNavigationProp({
      amount: new BigNumber(10),
      reason: 'My Reason',
      recipient: mockRecipient,
      recipientAddress: mockAccount,
    })

    const tree = renderer.create(
      <Provider store={store}>
        <RequestConfirmation navigation={navigation} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
