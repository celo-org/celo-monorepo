import { ApolloError } from 'apollo-boost'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { TokenTransactionType } from 'src/apollo/types'
import TransactionFeed, { FeedItem, FeedType } from 'src/transactions/TransactionFeed'
import { TransactionStatus } from 'src/transactions/types'
import { createMockStore } from 'test/utils'

jest.mock('src/utils/time.ts')

const exchangeTransactions: FeedItem[] = [
  {
    __typename: 'TokenExchange',
    status: TransactionStatus.Complete,
    type: TokenTransactionType.Exchange,
    amount: {
      value: '-30',
      currencyCode: 'cUSD',
      localAmount: null,
    },
    makerAmount: {
      value: '30',
      currencyCode: 'cUSD',
      localAmount: null,
    },
    takerAmount: {
      value: '200',
      currencyCode: 'cGLD',
      localAmount: null,
    },
    timestamp: 1542306118,
    hash: '0x00000000000000000000',
  },
]

const store = createMockStore({})

it('renders for no transactions', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <TransactionFeed loading={false} error={undefined} data={[]} kind={FeedType.HOME} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders for error', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <TransactionFeed
        loading={false}
        error={new ApolloError({})}
        data={[]}
        kind={FeedType.EXCHANGE}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders for loading', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <TransactionFeed loading={true} error={undefined} data={undefined} kind={FeedType.HOME} />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders for gold to dollar exchange properly', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <TransactionFeed
        loading={false}
        error={undefined}
        data={exchangeTransactions}
        kind={FeedType.HOME}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
