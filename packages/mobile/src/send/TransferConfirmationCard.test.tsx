import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import TransferConfirmationCard from 'src/send/TransferConfirmationCard'
import { TransactionTypes } from 'src/transactions/reducer'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockComment,
  mockContactWithPhone,
  mockCountryCode,
  mockE164Number,
} from 'test/values'

const store = createMockStore({
  account: {
    defaultCountryCode: mockCountryCode,
  },
})

jest.mock('src/web3/contracts', () => ({
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

describe('TransferConfirmationCard', () => {
  it('renders correctly for verification fee drilldown', () => {
    const props = {
      type: TransactionTypes.VERIFICATION_FEE,
      address: mockAccount,
      comment: '',
      value: new BigNumber(0.3),
      currency: CURRENCY_ENUM.DOLLAR,
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferConfirmationCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for faucet drilldown', () => {
    const props = {
      type: TransactionTypes.FAUCET,
      address: mockAccount,
      comment: '',
      value: new BigNumber(100),
      currency: CURRENCY_ENUM.DOLLAR,
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferConfirmationCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for received transaction drilldown', () => {
    const props = {
      type: TransactionTypes.RECEIVED,
      address: mockAccount,
      comment: '',
      value: new BigNumber(100),
      currency: CURRENCY_ENUM.DOLLAR,
      contact: mockContactWithPhone,
      e164PhoneNumber: mockE164Number,
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferConfirmationCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for sent transaction drilldown', () => {
    const props = {
      type: TransactionTypes.SENT,
      address: mockAccount,
      comment: mockComment,
      value: new BigNumber(100),
      currency: CURRENCY_ENUM.DOLLAR,
      contact: mockContactWithPhone,
      e164PhoneNumber: mockE164Number,
      fee: new BigNumber(0.01),
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferConfirmationCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
