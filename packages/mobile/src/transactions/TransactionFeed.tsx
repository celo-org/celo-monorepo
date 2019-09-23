import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import { ApolloError } from 'apollo-boost'
import * as React from 'react'
import { FlatList } from 'react-native'
import { connect } from 'react-redux'
import { Event, EventTypeNames, UserTransactionsData } from 'src/apollo/types'
import { CURRENCY_ENUM, resolveCurrency } from 'src/geth/consts'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { Invitees, SENTINEL_INVITE_COMMENT } from 'src/invite/actions'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import ExchangeFeedItem from 'src/transactions/ExchangeFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import { StandbyTransaction, TransactionStatus, TransactionTypes } from 'src/transactions/reducer'
import TransferFeedItem from 'src/transactions/TransferFeedItem'
import Logger from 'src/utils/Logger'
import { privateCommentKeySelector } from 'src/web3/selectors'

const TAG = 'transactions/TransactionFeed'

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

function exchangeFilter(tx: Event) {
  return (
    tx !== null &&
    (tx.__typename === EventTypeNames.Exchange || resolveCurrency(tx.symbol) === CURRENCY_ENUM.GOLD)
  )
}

function defaultFilter(tx: Event) {
  return (
    tx !== null &&
    (tx.__typename === EventTypeNames.Exchange || resolveCurrency(tx.symbol) !== CURRENCY_ENUM.GOLD)
  )
}

export class TransactionFeed extends React.PureComponent<Props> {
  // TODO(cmcewen): Clean this up. Standby txs should have the same data shape
  renderItem = (commentKeyBuffer: Buffer | null) => ({
    item: tx,
  }: {
    item: Event | StandbyTransaction
    index: number
  }) => {
    const { kind, addressToE164Number, invitees, recipientCache } = this.props

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
          commentKey={commentKeyBuffer}
          showLocalCurrency={kind === FeedType.HOME}
          {...tx}
        />
      )
      // @ts-ignore
    } else if (tx.__typename && tx.__typename === EventTypeNames.Exchange) {
      return (
        // @ts-ignore
        <ExchangeFeedItem
          status={TransactionStatus.Complete}
          showGoldAmount={kind === FeedType.EXCHANGE}
          {...tx}
        />
      )
    } else if (tx.type && tx.type === TransactionTypes.EXCHANGE) {
      // @ts-ignore
      return <ExchangeFeedItem showGoldAmount={kind === FeedType.EXCHANGE} {...tx} />
    } else if (tx.type) {
      return (
        // @ts-ignore
        <TransferFeedItem
          recipientCache={recipientCache}
          addressToE164Number={addressToE164Number}
          invitees={invitees}
          commentKey={commentKeyBuffer}
          showLocalCurrency={kind === FeedType.HOME}
          {...tx}
        />
      )
    } else {
      return <React.Fragment />
    }
  }

  keyExtractor = (item: Event | StandbyTransaction) => {
    return item.hash + item.timestamp.toString()
  }

  getQueryFilter = () => {
    if (this.props.kind === FeedType.EXCHANGE) {
      return exchangeFilter
    } else {
      return defaultFilter
    }
  }

  render() {
    const {
      kind,
      loading,
      error,
      data,
      standbyTransactions,
      standbyTransactionFilter,
      commentKey,
    } = this.props

    if (error) {
      Logger.error(TAG, 'Failure while loading transaction feed', error)
      return <NoActivity kind={kind} loading={loading} error={error} />
    }

    const events = (data && data.events) || []
    const commentKeyBuffer = commentKey ? Buffer.from(commentKey, 'hex') : null

    const queryDataTxIDs = new Set(events.map((event: Event) => event.hash))
    const notInQueryTxs = (tx: StandbyTransaction) =>
      !queryDataTxIDs.has(tx.id) && tx.status !== TransactionStatus.Failed
    let filteredStandbyTxs = standbyTransactions.filter(notInQueryTxs)

    if (standbyTransactionFilter) {
      filteredStandbyTxs = filteredStandbyTxs.filter(standbyTransactionFilter)
    }

    // TODO move filter to gql
    const queryFilter = this.getQueryFilter()
    const filteredQueryTxs = events.filter(queryFilter)
    const txData = [...filteredStandbyTxs, ...filteredQueryTxs]

    if (txData.length > 0) {
      return (
        <FlatList
          data={txData}
          keyExtractor={this.keyExtractor}
          ItemSeparatorComponent={ItemSeparator}
          renderItem={this.renderItem(commentKeyBuffer)}
        />
      )
    } else {
      return <NoActivity kind={kind} loading={loading} error={error} />
    }
  }
}

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(TransactionFeed)
