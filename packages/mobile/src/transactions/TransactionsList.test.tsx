import * as React from 'react'
import { MockedProvider } from 'react-apollo/test-utils'
import { render, waitForElement } from 'react-native-testing-library'
import { Provider } from 'react-redux'
import { TokenTransactionType, UserTransactionsQuery } from 'src/apollo/types'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { StandbyTransaction, TransactionStatus } from 'src/transactions/reducer'
import { TransactionFeed } from 'src/transactions/TransactionFeed'
import TransactionsList, { TRANSACTIONS_QUERY } from 'src/transactions/TransactionsList'
import { createMockStore } from 'test/utils'

jest.unmock('react-apollo')

const standbyTransactions: StandbyTransaction[] = [
  {
    id: 'a-standby-tx-id',
    type: TokenTransactionType.Sent,
    comment: 'Eye for an Eye',
    status: TransactionStatus.Pending,
    value: '100',
    symbol: CURRENCY_ENUM.DOLLAR,
    timestamp: 1542406110,
    address: '0072bvy2o23u',
  },
]

const failedStandbyTransactions: StandbyTransaction[] = [
  {
    type: TokenTransactionType.Exchange,
    status: TransactionStatus.Failed,
    inSymbol: CURRENCY_ENUM.DOLLAR,
    inValue: '20',
    outSymbol: CURRENCY_ENUM.GOLD,
    outValue: '30',
    timestamp: 1542409112,
    id: '0x00000000000000000001',
  },
]

const pendingStandbyTransactions: StandbyTransaction[] = [
  {
    id: 'a-standby-tx-id',
    hash: '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353',
    type: TokenTransactionType.Sent,
    comment: 'Hi',
    status: TransactionStatus.Pending,
    value: '0.2',
    symbol: CURRENCY_ENUM.DOLLAR,
    timestamp: 1578530538,
    address: '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10',
  },
]

const mockQueryData: UserTransactionsQuery = {
  tokenTransactions: {
    edges: [
      {
        node: {
          __typename: 'TokenTransfer',
          type: TokenTransactionType.Sent,
          hash: '0x4607df6d11e63bb024cf1001956de7b6bd7adc253146f8412e8b3756752b8353',
          amount: {
            value: '-0.2',
            currencyCode: 'cUSD',
            localAmount: {
              value: '-0.2',
              currencyCode: 'USD',
              exchangeRate: '1',
            },
          },
          timestamp: 1578530538,
          address: '0xce10ce10ce10ce10ce10ce10ce10ce10ce10ce10',
          comment: 'Hi',
        },
      },
      {
        node: {
          __typename: 'TokenExchange',
          type: TokenTransactionType.Exchange,
          hash: '0x16fbd53c4871f0657f40e1b4515184be04bed8912c6e2abc2cda549e4ad8f852',
          amount: {
            value: '0.994982275992944156',
            currencyCode: 'cUSD',
            localAmount: {
              value: '0.994982275992944156',
              currencyCode: 'USD',
              exchangeRate: '1',
            },
          },
          takerAmount: {
            value: '0.994982275992944156',
            currencyCode: 'cUSD',
            localAmount: {
              value: '0.994982275992944156',
              currencyCode: 'USD',
              exchangeRate: '1',
            },
          },
          makerAmount: {
            value: '0.1',
            currencyCode: 'cGLD',
            localAmount: {
              value: '1.006007113270411465777',
              currencyCode: 'USD',
              exchangeRate: '10.06007113270411465777',
            },
          },
          timestamp: 1578530498,
        },
      },
    ],
  },
}

const mocks = [
  {
    request: {
      query: TRANSACTIONS_QUERY,
      variables: {
        address: '0x0000000000000000000000000000000000007e57',
        token: 'cUSD',
        localCurrencyCode: 'MXN',
      },
    },
    result: {
      data: mockQueryData,
    },
  },
]

beforeEach(() => {
  // According to the react-native-testing-library docs, if we're using
  // fake timers, tests that use async/await will stall.
  jest.useRealTimers()
})

it('renders the received data along with the standby transactions', async () => {
  const store = createMockStore({
    transactions: { standbyTransactions },
  })

  const { getByType, toJSON } = render(
    <Provider store={store}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <TransactionsList currency={CURRENCY_ENUM.DOLLAR} />
      </MockedProvider>
    </Provider>
  )

  const feed = await waitForElement(() => getByType(TransactionFeed))
  expect(feed.props.data.length).toEqual(3)
  expect(toJSON()).toMatchSnapshot()
})

it('ignores pending standby transactions that are completed in the response and removes them', async () => {
  const store = createMockStore({
    transactions: { standbyTransactions: pendingStandbyTransactions },
  })

  const { getByType, toJSON } = render(
    <Provider store={store}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <TransactionsList currency={CURRENCY_ENUM.DOLLAR} />
      </MockedProvider>
    </Provider>
  )

  expect(store.getActions()).toEqual([])

  const feed = await waitForElement(() => getByType(TransactionFeed))
  expect(feed.props.data.length).toEqual(2)
  expect(toJSON()).toMatchSnapshot()

  expect(store.getActions()).toEqual([
    { type: 'HOME/REFRESH_BALANCES' },
    { type: 'TRANSACTIONS/REMOVE_STANDBY_TRANSACTION', idx: 'a-standby-tx-id' },
  ])
})

it('ignores failed standby transactions', async () => {
  const store = createMockStore({
    transactions: { standbyTransactions: failedStandbyTransactions },
  })

  const { getByType, toJSON } = render(
    <Provider store={store}>
      <MockedProvider mocks={mocks} addTypename={false}>
        <TransactionsList currency={CURRENCY_ENUM.DOLLAR} />
      </MockedProvider>
    </Provider>
  )

  const feed = await waitForElement(() => getByType(TransactionFeed))
  expect(feed.props.data.length).toEqual(2)
  expect(toJSON()).toMatchSnapshot()
})
