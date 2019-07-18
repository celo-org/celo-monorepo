import * as React from 'react'
import { connect } from 'react-redux'
import UserTransactionsQuery from 'src/apollo/types'
import { transactionQuery } from 'src/home/TransactionsList'
import { RootState } from 'src/redux/reducers'
import { resetStandbyTransactions } from 'src/transactions/actions'
import { StandbyTransaction, TransactionTypes } from 'src/transactions/reducer'
import TransactionFeed, { FeedType } from 'src/transactions/TransactionFeed'
import { currentAccountSelector } from 'src/web3/selectors'

interface DispatchProps {
  resetStandbyTransactions: typeof resetStandbyTransactions
}

interface StateProps {
  address?: string | null
}

type Props = StateProps & DispatchProps

const mapStateToProps = (state: RootState): StateProps => ({
  address: currentAccountSelector(state),
})

function filterToExchangeTxs(tx: StandbyTransaction) {
  return tx.type === TransactionTypes.EXCHANGED
}

export class Activity extends React.Component<Props> {
  componentDidMount() {
    this.props.resetStandbyTransactions()
  }

  render() {
    const { address } = this.props
    const queryAddress = address || ''
    return (
      <UserTransactionsQuery
        query={transactionQuery}
        pollInterval={1000}
        variables={{ address: queryAddress }}
      >
        {({ loading, error, data }) => {
          return (
            <TransactionFeed
              kind={FeedType.EXCHANGE}
              loading={loading}
              error={error}
              data={data}
              standbyTransactionFilter={filterToExchangeTxs}
            />
          )
        }}
      </UserTransactionsQuery>
    )
  }
}

export default connect<StateProps, DispatchProps, {}, RootState>(
  mapStateToProps,
  {
    resetStandbyTransactions,
  }
)(Activity)
