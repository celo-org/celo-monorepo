import { ApolloError } from 'apollo-boost'
import * as React from 'react'
import { FlatList } from 'react-native'
import { connect } from 'react-redux'
import { Event, EventTypeNames, UserTransactionsData } from 'src/apollo/types'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { Invitees, SENTINEL_INVITE_COMMENT } from 'src/invite/actions'
import { RootState } from 'src/redux/reducers'
import { recipientCacheSelector } from 'src/send/reducers'
import ExchangeFeedItem from 'src/transactions/ExchangeFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import { StandbyTransaction, TransactionStatus, TransactionTypes } from 'src/transactions/reducer'
import TransferFeedItem from 'src/transactions/TransferFeedItem'
import Logger from 'src/utils/Logger'
import { NumberToRecipient } from 'src/utils/recipient'
import { privateCommentKeySelector } from 'src/web3/selectors'

export enum FeedType {
  HOME = 'home',
  EXCHANGE = 'exchange',
}

interface StateProps {
  invitees: Invitees
  commentKey: string | null | undefined
  addressToE164Number: AddressToE164NumberType
  standbyTransactions: StandbyTransaction[]
  recipientCache: NumberToRecipient
}

type Props = {
  kind: FeedType
  loading: boolean
  error: ApolloError | undefined
  data: UserTransactionsData | undefined
  standbyTransactions: StandbyTransaction[]
  standbyTransactionFilter?: (tx: StandbyTransaction) => boolean
} & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  invitees: state.invite.invitees,
  commentKey: privateCommentKeySelector(state),
  addressToE164Number: state.identity.addressToE164Number,
  standbyTransactions: state.transactions.standbyTransactions,
  recipientCache: recipientCacheSelector(state),
})

export class TransactionFeed extends React.PureComponent<Props> {
  renderItem = ({ item, index }: { item: Event | StandbyTransaction; index: number }) => {
    // TODO(cmcewen): Clean this up. Standby txs should have the same data shape

    const { kind, addressToE164Number, invitees, recipientCache } = this.props
    const tx = item
    const commentKey = this.props.commentKey ? Buffer.from(this.props.commentKey, 'hex') : null

    if (tx.hasOwnProperty('comment')) {
      // @ts-ignore
      if (tx.comment === SENTINEL_INVITE_COMMENT) {
        if (tx.type === TransactionTypes.SENT) {
          tx.type = TransactionTypes.INVITE_SENT
        } else if (tx.type === TransactionTypes.RECEIVED) {
          tx.type = TransactionTypes.INVITE_RECEIVED
        }
      }
    }

    // @ts-ignore
    if (tx.__typename && tx.__typename === EventTypeNames.Transfer) {
      return (
        // @ts-ignore
        <TransferFeedItem
          status={TransactionStatus.Complete}
          invitees={invitees}
          addressToE164Number={addressToE164Number}
          recipientCache={recipientCache}
          commentKey={commentKey}
          {...tx}
        />
      )
      // @ts-ignore
    } else if (tx.__typename && tx.__typename === EventTypeNames.Exchange) {
      return (
        // @ts-ignore
        <ExchangeFeedItem
          showImage={kind === FeedType.HOME}
          status={TransactionStatus.Complete}
          {...tx}
        />
      )
    } else if (tx.type && tx.type === TransactionTypes.EXCHANGED) {
      // @ts-ignore
      return <ExchangeFeedItem showImage={kind === FeedType.HOME} {...tx} />
    } else if (tx.type) {
      return (
        // @ts-ignore
        <TransferFeedItem
          recipientCache={recipientCache}
          addressToE164Number={addressToE164Number}
          invitees={invitees}
          commentKey={commentKey}
          {...tx}
        />
      )
    } else {
      return <React.Fragment />
    }
  }

  keyExtractor = (item: Event | StandbyTransaction) => {
    return item.timestamp.toString()
  }

  render() {
    const { kind, loading, error, data, standbyTransactions, standbyTransactionFilter } = this.props
    const events = (data && data.events) || []

    if (error) {
      Logger.error('TransactionFeed', 'Failure while loading transaction feed', error)
    }

    const queryDataTxIDs = new Set(events.map((event: Event) => event.hash))
    const notInQueryTxs = (tx: StandbyTransaction) =>
      !queryDataTxIDs.has(tx.id) && tx.status !== TransactionStatus.Failed
    let filteredStandbyTxs = standbyTransactions.filter(notInQueryTxs)

    if (standbyTransactionFilter) {
      filteredStandbyTxs = filteredStandbyTxs.filter(standbyTransactionFilter)
    }

    // TODO move filter to gql
    const exchangeFilter = (tx: Event) =>
      tx !== null && (kind === FeedType.EXCHANGE ? tx.__typename === EventTypeNames.Exchange : true)
    const filteredQueryTxs = events.filter(exchangeFilter)
    const txData = [...filteredStandbyTxs, ...filteredQueryTxs]

    if (txData.length > 0) {
      return (
        <FlatList data={txData} keyExtractor={this.keyExtractor} renderItem={this.renderItem} />
      )
    } else {
      return <NoActivity kind={kind} loading={loading} error={error} />
    }
  }
}

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(TransactionFeed)
