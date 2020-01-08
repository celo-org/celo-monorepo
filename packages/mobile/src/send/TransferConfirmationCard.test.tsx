import { CURRENCY_ENUM } from '@celo/utils/src/currencies'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { TransactionType } from 'src/apollo/types'
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
      type: TransactionType.VerificationFee,
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
      type: TransactionType.Faucet,
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
      type: TransactionType.Received,
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

  it('renders correctly for received escrow transaction drilldown', () => {
    const props = {
      type: TransactionType.EscrowReceived,
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
      type: TransactionType.Sent,
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

  it('renders correctly for sent escrow transaction drilldown', () => {
    const props = {
      type: TransactionType.EscrowSent,
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
