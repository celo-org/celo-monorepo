import gql from 'graphql-tag'
import * as React from 'react'
import { WithNamespaces, withNamespaces } from 'react-i18next'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import UserTransactionsQuery, { Event, UserTransactionsData } from 'src/apollo/types'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { RootState } from 'src/redux/reducers'
import { removeStandbyTransaction } from 'src/transactions/actions'
import { StandbyTransaction, TransactionStatus, TransactionTypes } from 'src/transactions/reducer'
import TransactionFeed, { FeedType } from 'src/transactions/TransactionFeed'
import { currentAccountSelector } from 'src/web3/selectors'

const standbyTransactions: StandbyTransaction[] = [
  {
    id: '0110',
    type: TransactionTypes.SENT,
    comment: 'Eye for an Eye',
    status: TransactionStatus.Pending,
    value: '100',
    symbol: CURRENCY_ENUM.DOLLAR,
    timestamp: 1542406112,
    address: '0072bvy2o23u',
  },
  {
    id: '0112',
    type: TransactionTypes.EXCHANGE,
    status: TransactionStatus.Pending,
    inSymbol: CURRENCY_ENUM.DOLLAR,
    inValue: '20',
    outSymbol: CURRENCY_ENUM.GOLD,
    outValue: '30',
    timestamp: 1542409112,
  },
  {
    id: '0113',
    type: TransactionTypes.NETWORK_FEE,
    comment: '',
    status: TransactionStatus.Pending,
    value: '0.0001',
    symbol: CURRENCY_ENUM.DOLLAR,
    timestamp: 1542406112,
    address: '0072bvy2o23u',
  },
]

interface StateProps {
  address?: string | null
  standbyTransactions: StandbyTransaction[]
}

interface DispatchProps {
  removeStandbyTransaction: typeof removeStandbyTransaction
}

type Props = StateProps &
  DispatchProps &
  WithNamespaces & {
    key?: string
  }

const HomeExchangeFragment = gql`
  fragment HomeExchange on Exchange {
    type
    hash
    inValue
    outValue
    inSymbol
    outSymbol
    timestamp
  }
`

const HomeTransferFragment = gql`
  fragment HomeTransfer on Transfer {
    type
    hash
    value
    symbol
    timestamp
    address
    comment
  }
`

// https://github.com/dotansimha/graphql-code-generator/issues/700
// https://github.com/dotansimha/graphql-code-generator/issues/695
export const transactionQuery = gql`
  query UserTransactions($address: String!) {
    events(address: $address) {
      __typename
      ...HomeExchange
      ...HomeTransfer
    }
  }

  ${HomeExchangeFragment}
  ${HomeTransferFragment}
`

const mapStateToProps = (state: RootState): StateProps => ({
  address: currentAccountSelector(state),
  standbyTransactions: state.transactions.standbyTransactions,
})

export class TransactionsList extends React.PureComponent<Props> {
  txsFetched = (data: UserTransactionsData | undefined) => {
    if (!data || !data.events || data.events.length < 1) {
      return
    }

    const events = data.events
    const queryDataTxIDs = new Set(events.map((event: Event) => event.hash))
    const inQueryTxs = (tx: StandbyTransaction) =>
      tx.hash && queryDataTxIDs.has(tx.hash) && tx.status !== TransactionStatus.Failed
    const filteredStandbyTxs = this.props.standbyTransactions.filter(inQueryTxs)
    filteredStandbyTxs.forEach((tx) => {
      this.props.removeStandbyTransaction(tx.id)
    })
  }

  render() {
    const { address } = this.props
    const queryAddress = address || ''

    return (
      <UserTransactionsQuery
        query={transactionQuery}
        pollInterval={10000}
        variables={{ address: queryAddress }}
        onCompleted={this.txsFetched}
      >
        {({ loading, error, data }) => {
          return (
            <TransactionFeed
              loading={loading}
              error={error}
              data={{ events: [] }}
              // standbyTransactions={standbyTransactions}
              kind={FeedType.HOME}
            />
          )
        }}
      </UserTransactionsQuery>
    )
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(
    mapStateToProps,
    {
      removeStandbyTransaction,
    }
  )(withNamespaces(Namespaces.walletFlow5)(TransactionsList))
)
