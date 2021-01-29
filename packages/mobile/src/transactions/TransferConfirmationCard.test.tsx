import BigNumber from 'bignumber.js'
import * as React from 'react'
import { fireEvent, render } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { TokenTransactionType } from 'src/apollo/types'
import { navigate } from 'src/navigator/NavigationService'
import { Screens } from 'src/navigator/Screens'
import TransferConfirmationCard from 'src/transactions/TransferConfirmationCard'
import { createMockStore } from 'test/utils'
import {
  mockAccount,
  mockComment,
  mockContactWithPhone,
  mockCountryCode,
  mockE164Number,
  mockRecipient,
} from 'test/values'

const celoRewardSenderAddress = '0x123456'

const store = createMockStore({
  account: {
    defaultCountryCode: mockCountryCode,
  },
  identity: {
    addressToDisplayName: {
      [celoRewardSenderAddress]: {
        name: 'CELO Rewards',
        isCeloRewardSender: true,
      },
    },
  },
})

describe('TransferConfirmationCard', () => {
  it('renders correctly for verification fee drilldown', () => {
    const props = {
      type: TokenTransactionType.VerificationFee,
      addressHasChanged: false,
      address: mockAccount,
      comment: '',
      amount: { value: '-0.3', currencyCode: 'cUSD', localAmount: null },
      recipient: mockRecipient,
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
      addressHasChanged: false,
      address: mockAccount,
      comment: '',
      amount: { value: '100', currencyCode: 'cUSD', localAmount: null },
      recipient: mockRecipient,
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
      addressHasChanged: false,
      address: mockAccount,
      comment: '',
      amount: { value: '100', currencyCode: 'cUSD', localAmount: null },
      contact: mockContactWithPhone,
      e164PhoneNumber: mockE164Number,
      recipient: mockRecipient,
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferConfirmationCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for received CELO reward', () => {
    const props = {
      type: TokenTransactionType.Received,
      addressHasChanged: false,
      address: celoRewardSenderAddress,
      comment: '',
      amount: { value: '100', currencyCode: 'cUSD', localAmount: null },
      recipient: mockRecipient,
    }

    const tree = render(
      <Provider store={store}>
        <TransferConfirmationCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
    fireEvent.press(tree.getByTestId('celoRewards/learnMore'))
    expect(navigate).toHaveBeenCalledWith(Screens.ConsumerIncentivesHomeScreen)
  })

  it('renders correctly for received escrow transaction drilldown', () => {
    const props = {
      type: TokenTransactionType.EscrowReceived,
      addressHasChanged: false,
      address: mockAccount,
      comment: '',
      amount: { value: '100', currencyCode: 'cUSD', localAmount: null },
      contact: mockContactWithPhone,
      e164PhoneNumber: mockE164Number,
      recipient: mockRecipient,
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
      addressHasChanged: false,
      address: mockAccount,
      comment: mockComment,
      amount: { value: '-100', currencyCode: 'cUSD', localAmount: null },
      contact: mockContactWithPhone,
      e164PhoneNumber: mockE164Number,
      recipient: mockRecipient,
      fee: new BigNumber(0.01),
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferConfirmationCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })

  it('renders correctly for CELO withdrawal transaction drilldown', () => {
    const props = {
      type: TokenTransactionType.Sent,
      addressHasChanged: false,
      address: mockAccount,
      comment: mockComment,
      amount: { value: '-100', currencyCode: 'cGLD', localAmount: null },
      fee: new BigNumber(0.01),
      recipient: mockRecipient,
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
      addressHasChanged: false,
      address: mockAccount,
      comment: mockComment,
      amount: { value: '-100', currencyCode: 'cUSD', localAmount: null },
      contact: mockContactWithPhone,
      e164PhoneNumber: mockE164Number,
      fee: new BigNumber(0.01),
      recipient: mockRecipient,
    }

    const tree = renderer.create(
      <Provider store={store}>
        <TransferConfirmationCard {...props} />
      </Provider>
    )
    expect(tree).toMatchSnapshot()
  })
})
