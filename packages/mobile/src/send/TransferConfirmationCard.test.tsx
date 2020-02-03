import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { TokenTransactionType } from 'src/apollo/types'
import TransferConfirmationCard from 'src/send/TransferConfirmationCard'
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

describe('TransferConfirmationCard', () => {
  it('renders correctly for verification fee drilldown', () => {
    const props = {
      type: TokenTransactionType.VerificationFee,
      address: mockAccount,
      comment: '',
      amount: { value: '-0.3', currencyCode: 'cUSD', localAmount: null },
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
      type: TokenTransactionType.Faucet,
      address: mockAccount,
      comment: '',
      amount: { value: '100', currencyCode: 'cUSD', localAmount: null },
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
      type: TokenTransactionType.Received,
      address: mockAccount,
      comment: '',
      amount: { value: '100', currencyCode: 'cUSD', localAmount: null },
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

  it('renders correctly for received escrow transaction drilldown', () => {
    const props = {
      type: TokenTransactionType.EscrowReceived,
      address: mockAccount,
      comment: '',
      amount: { value: '100', currencyCode: 'cUSD', localAmount: null },
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
      type: TokenTransactionType.Sent,
      address: mockAccount,
      comment: mockComment,
      amount: { value: '-100', currencyCode: 'cUSD', localAmount: null },
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

  it('renders correctly for sent escrow transaction drilldown', () => {
    const props = {
      type: TokenTransactionType.EscrowSent,
      address: mockAccount,
      comment: mockComment,
      amount: { value: '-100', currencyCode: 'cUSD', localAmount: null },
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
