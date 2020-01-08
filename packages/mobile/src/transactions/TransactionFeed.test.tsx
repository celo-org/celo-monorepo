import { ApolloError } from 'apollo-boost'
import * as React from 'react'
import 'react-native'
import { Provider } from 'react-redux'
import * as renderer from 'react-test-renderer'
import { EventTypeNames, HomeExchangeFragment, TransactionType } from 'src/apollo/types'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { StandbyTransaction, TransactionStatus } from 'src/transactions/reducer'
import TransactionFeed, {
  FeedType,
  TransactionFeed as TransactionFeedClass,
} from 'src/transactions/TransactionFeed'
import { createMockStore } from 'test/utils'

jest.mock('src/utils/time.ts')

const standbyTransactions: StandbyTransaction[] = [
  {
    id: '0110',
    type: TransactionType.Sent,
    comment: 'Eye for an Eye',
    status: TransactionStatus.Pending,
    value: '100',
    symbol: CURRENCY_ENUM.DOLLAR,
    timestamp: 1542406112,
    address: '0072bvy2o23u',
  },
  {
    id: '0112',
    type: TransactionType.Exchange,
    status: TransactionStatus.Pending,
    inSymbol: CURRENCY_ENUM.DOLLAR,
    inValue: '20',
    outSymbol: CURRENCY_ENUM.GOLD,
    outValue: '30',
    timestamp: 1542409112,
  },
  {
    id: '0113',
    type: TransactionType.NetworkFee,
    comment: '',
    status: TransactionStatus.Pending,
    value: '0.0001',
    symbol: CURRENCY_ENUM.DOLLAR,
    timestamp: 1542406112,
    address: '0072bvy2o23u',
  },
]

const failedExchange: StandbyTransaction[] = [
  {
    type: TransactionType.Exchange,
    status: TransactionStatus.Failed,
    inSymbol: CURRENCY_ENUM.DOLLAR,
    inValue: '20',
    outSymbol: CURRENCY_ENUM.GOLD,
    outValue: '30',
    timestamp: 1542409112,
    id: '0x00000000000000000001',
  },
]

const exchangeEvents: HomeExchangeFragment[] = [
  {
    __typename: EventTypeNames.Exchange,
    type: TransactionType.Exchange,
    inValue: 30,
    outValue: 200,
    outSymbol: CURRENCY_ENUM.GOLD,
    inSymbol: CURRENCY_ENUM.DOLLAR,
    timestamp: 1542306118,
    hash: '0x00000000000000000000',
  },
]

const store = createMockStore({
  transactions: { standbyTransactions },
})

it('renders for no transactions', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <TransactionFeed
        loading={false}
        error={undefined}
        data={{ events: [] }}
        kind={FeedType.HOME}
      />
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
        data={undefined}
        kind={FeedType.EXCHANGE}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders for loading', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <TransactionFeed
        loading={true}
        error={undefined}
        data={{ events: [] }}
        kind={FeedType.HOME}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('renders for standbyTransactions', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <TransactionFeedClass
        loading={false}
        error={undefined}
        data={{ events: [] }}
        standbyTransactions={standbyTransactions}
        kind={FeedType.HOME}
        addressToE164Number={{}}
        invitees={{}}
        commentKey={''}
        recipientCache={{}}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})

it('filters out Failed', () => {
  const tree = renderer.create(
    <Provider store={store}>
      <TransactionFeedClass
        loading={false}
        error={undefined}
        data={{ events: null }}
        standbyTransactions={failedExchange}
        kind={FeedType.EXCHANGE}
        addressToE164Number={{}}
        invitees={{}}
        commentKey={''}
        recipientCache={{}}
      />
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
        data={{
          events: exchangeEvents,
        }}
        kind={FeedType.HOME}
      />
    </Provider>
  )
  expect(tree).toMatchSnapshot()
})
