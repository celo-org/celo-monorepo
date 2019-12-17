import ItemSeparator from '@celo/react-components/components/ItemSeparator'
import { ApolloError } from 'apollo-boost'
import * as React from 'react'
import { FlatList } from 'react-native'
import { connect } from 'react-redux'
import {
  ExchangeTransaction,
  Transaction,
  TransferTransaction,
  UserTransactionsData,
} from 'src/apollo/types'
import { CURRENCY_ENUM, resolveCurrency } from 'src/geth/consts'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { Invitees, SENTINEL_INVITE_COMMENT } from 'src/invite/actions'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import ExchangeFeedItem from 'src/transactions/ExchangeFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import {
  isTransferType,
  StandbyTransaction,
  TransactionStatus,
  TransactionTypes,
} from 'src/transactions/reducer'
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
  transactionFilter?: (tx: StandbyTransaction) => boolean
} & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  invitees: state.invite.invitees,
  commentKey: privateCommentKeySelector(state),
  addressToE164Number: state.identity.addressToE164Number,
  standbyTransactions: state.transactions.standbyTransactions,
  recipientCache: recipientCacheSelector(state),
})

function exchangeFilter(tx: Transaction) {
  return (
    tx !== null &&
    // Show exchange and gold transactions in exchange tab feed
    (tx.type === TransactionTypes.EXCHANGE || resolveCurrency(tx.symbol) === CURRENCY_ENUM.GOLD)
  )
}

function defaultFilter(tx: Transaction) {
  return (
    tx !== null &&
    // Show exchange and stableToken transactions in home feed
    (tx.type === TransactionTypes.EXCHANGE || resolveCurrency(tx.symbol) !== CURRENCY_ENUM.GOLD)
  )
}

export class TransactionFeed extends React.PureComponent<Props> {
  renderItem = (commentKeyBuffer: Buffer | null) => ({
    item: tx,
  }: {
    item: ExchangeTransaction | TransferTransaction
    index: number
  }) => {
    const { kind, addressToE164Number, invitees, recipientCache } = this.props

    if (tx.type === TransactionTypes.EXCHANGE) {
      return (
        <ExchangeFeedItem
          status={tx.status ? tx.status : TransactionStatus.Complete}
          showGoldAmount={kind === FeedType.EXCHANGE}
          {...tx}
        />
      )
    } else if (isTransferType(tx.type)) {
      // Identify invite txs
      if (tx.hasOwnProperty('comment')) {
        if (tx.comment === SENTINEL_INVITE_COMMENT) {
          if (tx.type === TransactionTypes.SENT) {
            tx.type = TransactionTypes.INVITE_SENT
          } else if (tx.type === TransactionTypes.RECEIVED) {
            tx.type = TransactionTypes.INVITE_RECEIVED
          }
        }
      }
      return (
        <TransferFeedItem
          status={tx.status ? tx.status : TransactionStatus.Complete}
          invitees={invitees}
          addressToE164Number={addressToE164Number}
          recipientCache={recipientCache}
          commentKey={commentKeyBuffer}
          showLocalCurrency={kind === FeedType.HOME}
          {...tx}
        />
      )
    } else {
      Logger.error('TransactionFeed', `Unexpected transaction type ${tx.type}`)
      return <React.Fragment />
    }
  }

  keyExtractor = (item: Transaction) => {
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
      transactionFilter,
      commentKey,
    } = this.props

    if (error) {
      Logger.error(TAG, 'Failure while loading transaction feed', error)
      return <NoActivity kind={kind} loading={loading} error={error} />
    }

    const events = (data && data.events) || []
    const commentKeyBuffer = commentKey ? Buffer.from(commentKey, 'hex') : null

    const queryDataTxIDs = new Set(events.map((event: Transaction) => event.hash))
    const notInQueryTxs = (tx: StandbyTransaction) =>
      !queryDataTxIDs.has(tx.id) && tx.status !== TransactionStatus.Failed
    let filteredStandbyTxs = standbyTransactions.filter(notInQueryTxs)

    if (transactionFilter) {
      filteredStandbyTxs = filteredStandbyTxs.filter(transactionFilter)
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
