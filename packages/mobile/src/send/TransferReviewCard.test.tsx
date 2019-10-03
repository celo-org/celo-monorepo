import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import TransferReviewCard from 'src/send/TransferReviewCard'
import { TransactionTypes } from 'src/transactions/reducer'
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

jest.mock('src/web3/contracts', () => ({
  web3: {
    utils: {
      fromWei: jest.fn((x: any) => x / 1e18),
    },
  },
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('TransferReviewCard', () => {
  it('renders correctly for send review', () => {
    const props = {
      type: TransactionTypes.SENT,
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
      type: TransactionTypes.INVITE_SENT,
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
      type: TransactionTypes.PAY_REQUEST,
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
