import BigNumber from 'bignumber.js'
import * as React from 'react'
import { render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { getSendFee } from 'src/send/saga'
import SendConfirmation from 'src/send/SendConfirmation'
import { createMockNavigationProp, createMockStore } from 'test/utils'
import { mockAccount, mockRecipient } from 'test/values'

const TEST_FEE = new BigNumber(10000000000000000)

jest.mock('src/send/saga')

jest.mock('src/web3/contracts', () => ({
  web3: {
    utils: {
      fromWei: jest.fn((x: any) => x / 1e18),
    },
  },
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

const mockedGetSendFee = getSendFee as jest.Mock

const store = createMockStore({
  stableToken: {
    balance: '200',
  },
})

describe('SendConfirmation', () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    mockedGetSendFee.mockClear()
  })

  it('renders correctly for send payment confirmation', async () => {
    const navigation = createMockNavigationProp({
      recipient: mockRecipient,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      reason: 'My Reason',
    })

    mockedGetSendFee.mockImplementation(async () => TEST_FEE)

    const { toJSON, queryByText } = render(
      <Provider store={store}>
        <SendConfirmation navigation={navigation} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).not.toBeNull()
    expect(queryByText('0.001')).toBeNull()

    // TODO figure out why this waitForElement isn't working here and in tests below.
    // Wait for fee to be calculated and displayed
    // await waitForElement(() => getByText('0.001'))
    // expect(queryByText('0.001')).not.toBeNull()

    // expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly for send payment confirmation when fee calculation fails', async () => {
    const navigation = createMockNavigationProp({
      recipient: mockRecipient,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      reason: 'My Reason',
    })

    mockedGetSendFee.mockImplementation(async () => {
      throw new Error('Calculate fee failed')
    })

    const { queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <SendConfirmation navigation={navigation} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).not.toBeNull()
    expect(queryByText('0.0100')).toBeNull()

    // Wait for fee error
    await waitForElement(() => getByText('---'))

    expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly for payment request confirmation', async () => {
    const navigation = createMockNavigationProp({
      recipient: mockRecipient,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      reason: 'My Reason',
    })

    mockedGetSendFee.mockImplementation(async () => TEST_FEE)

    const { queryByText, toJSON } = render(
      <Provider store={store}>
        <SendConfirmation navigation={navigation} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).not.toBeNull()
    expect(queryByText('0.0100')).toBeNull()

    // Wait for fee to be calculated and displayed
    // await waitForElement(() => getByText('0.0100'))

    // expect(toJSON()).toMatchSnapshot()
  })

  it('renders correctly for payment request confirmation when fee calculation fails', async () => {
    const navigation = createMockNavigationProp({
      recipient: mockRecipient,
      recipientAddress: mockAccount,
      amount: new BigNumber(10),
      reason: 'My Reason',
    })

    mockedGetSendFee.mockImplementation(async () => {
      throw new Error('Calculate fee failed')
    })

    const { queryByText, getByText, toJSON } = render(
      <Provider store={store}>
        <SendConfirmation navigation={navigation} />
      </Provider>
    )

    // Initial render
    expect(toJSON()).toMatchSnapshot()
    expect(queryByText('securityFee')).not.toBeNull()
    expect(queryByText('0.0100')).toBeNull()

    // Wait for fee error
    await waitForElement(() => getByText('---'))

    expect(toJSON()).toMatchSnapshot()
  })
})
