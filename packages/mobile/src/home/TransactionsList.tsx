import gql from 'graphql-tag'
import * as React from 'react'
import { Query } from 'react-apollo'
import { WithTranslation } from 'react-i18next'
import { connect } from 'react-redux'
import componentWithAnalytics from 'src/analytics/wrapper'
import { Token, UserTransactionsQuery, UserTransactionsQueryVariables } from 'src/apollo/types'
import { Namespaces, withTranslation } from 'src/i18n'
import { RootState } from 'src/redux/reducers'
import { removeStandbyTransaction } from 'src/transactions/actions'
import { StandbyTransaction, TransactionStatus } from 'src/transactions/reducer'
import TransactionFeed, { FeedType } from 'src/transactions/TransactionFeed'
import { currentAccountSelector } from 'src/web3/selectors'

interface StateProps {
  address?: string | null
  standbyTransactions: StandbyTransaction[]
}

interface DispatchProps {
  removeStandbyTransaction: typeof removeStandbyTransaction
}

type Props = StateProps &
  DispatchProps &
  WithTranslation & {
    key?: string
  }

// See https://github.com/microsoft/TypeScript/issues/16069#issuecomment-565658443
function isPresent<T>(t: T | undefined | null | void): t is T {
  return t !== undefined && t !== null
}

export const TRANSACTIONS_QUERY = gql`
  query UserTransactions($address: Address!, $token: Token!, $localCurrencyCode: String) {
    transactions(address: $address, token: $token, localCurrencyCode: $localCurrencyCode) {
      edges {
        node {
          ...TransactionFeed
        }
      }
    }
  }

  ${TransactionFeed.fragments.transaction}
`

// export type UserTransactionsComponentProps = Omit<
//   ApolloReactComponents.QueryComponentOptions<
//     UserTransactionsQuery,
//     UserTransactionsQueryVariables
//   >,
//   'query'
// > &
//   ({ variables: UserTransactionsQueryVariables; skip?: boolean } | { skip: boolean })

class UserTransactionsComponent extends Query<
  UserTransactionsQuery,
  UserTransactionsQueryVariables
> {}

// const UserTransactionsComponent = (props: UserTransactionsComponentProps) => (
//   <ApolloReactComponents.Query<UserTransactionsQuery, UserTransactionsQueryVariables>
//     query={UserTransactionsDocument}
//     {...props}
//   />
// )

// export type UserTransactionsQueryResult = ApolloReactCommon.QueryResult<
//   UserTransactionsQuery,
//   UserTransactionsQueryVariables
// >

const mapStateToProps = (state: RootState): StateProps => ({
  address: currentAccountSelector(state),
  standbyTransactions: state.transactions.standbyTransactions,
})

export class TransactionsList extends React.PureComponent<Props> {
  txsFetched = (data: UserTransactionsQuery | undefined) => {
    if (!data || !data.events || data.events.length < 1) {
      return
    }

    const events = data.events
    const queryDataTxIDs = new Set(events.map((event) => event?.hash))
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
      <UserTransactionsComponent
        query={TRANSACTIONS_QUERY}
        pollInterval={10000}
        variables={{ address: queryAddress, token: Token.CUsd, localCurrencyCode: 'EUR' }}
        onCompleted={this.txsFetched}
      >
        {({ loading, error, data }) => {
          console.log('==dataquery', data)
          const transactions =
            data?.transactions?.edges.map((edge) => edge.node).filter(isPresent) ?? []
          return (
            <TransactionFeed
              kind={FeedType.HOME}
              loading={loading}
              error={error}
              data={transactions}
            />
          )
        }}
      </UserTransactionsComponent>
    )
  }
}

export default componentWithAnalytics(
  connect<StateProps, DispatchProps, {}, RootState>(mapStateToProps, {
    removeStandbyTransaction,
  })(withTranslation(Namespaces.walletFlow5)(TransactionsList))
)
