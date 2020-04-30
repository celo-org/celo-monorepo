import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { TokenTransactionType } from 'src/apollo/types'
import TransferReviewCard from 'src/send/TransferReviewCard'
import { createMockStore } from 'test/utils'
import { mockAccount, mockContactWithPhone, mockCountryCode, mockE164Number } from 'test/values'

const store = createMockStore({
  account: {
    defaultCountryCode: mockCountryCode,
  },
  stableToken: {
    balance: '100',
  },
})

describe('TransferReviewCard', () => {
  it('renders correctly for send review', () => {
    const props = {
      type: TokenTransactionType.Sent,
      address: mockAccount,
      comment: '',
      value: new BigNumber(0.3),
      currency: CURRENCY_ENUM.DOLLAR,
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferReviewCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for invite review', () => {
    const props = {
      type: TokenTransactionType.InviteSent,
      address: mockAccount,
      comment: '',
      value: new BigNumber(100),
      currency: CURRENCY_ENUM.DOLLAR,
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferReviewCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for pay request review', () => {
    const props = {
      type: TokenTransactionType.PayRequest,
      address: mockAccount,
      comment: '',
      value: new BigNumber(100),
      currency: CURRENCY_ENUM.DOLLAR,
      contact: mockContactWithPhone,
      e164PhoneNumber: mockE164Number,
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferReviewCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
