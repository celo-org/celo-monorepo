import { ApolloError } from 'apollo-boost'
import gql from 'graphql-tag'
import * as React from 'react'
import { FlatList } from 'react-native'
import { connect } from 'react-redux'
import { TransactionFeedFragment } from 'src/apollo/types'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { NumberToRecipient } from 'src/recipients/recipient'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import ExchangeFeedItem from 'src/transactions/ExchangeFeedItem'
import GoldTransactionFeedItem from 'src/transactions/GoldTransactionFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import TransferFeedItem from 'src/transactions/TransferFeedItem'
import { TransactionStatus } from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { privateCommentKeySelector } from 'src/web3/selectors'

const TAG = 'transactions/TransactionFeed'

export enum FeedType {
  HOME = 'home',
  EXCHANGE = 'exchange',
}

interface StateProps {
  commentKey: string | null
  addressToE164Number: AddressToE164NumberType
  recipientCache: NumberToRecipient
}

export type FeedItem = TransactionFeedFragment & {
  status: TransactionStatus // for standby transactions
}

type Props = {
  kind: FeedType
  loading: boolean
  error: ApolloError | undefined
  data: FeedItem[] | undefined
} & StateProps

const mapStateToProps = (state: RootState): StateProps => ({
  commentKey: privateCommentKeySelector(state),
  addressToE164Number: state.identity.addressToE164Number,
  recipientCache: recipientCacheSelector(state),
})

export class TransactionFeed extends React.PureComponent<Props> {
  static fragments = {
    transaction: gql`
      fragment TransactionFeed on TokenTransaction {
        ...ExchangeItem
        ...TransferItem
      }

      ${ExchangeFeedItem.fragments.exchange}
      ${TransferFeedItem.fragments.transfer}
    `,
  }

  renderItem = ({ item: tx }: { item: FeedItem; index: number }) => {
    const { addressToE164Number, recipientCache, commentKey, kind } = this.props

    switch (tx.__typename) {
      case 'TokenTransfer':
        return (
          <TransferFeedItem
            addressToE164Number={addressToE164Number}
            recipientCache={recipientCache}
            commentKey={commentKey}
            {...tx}
          />
        )
      case 'TokenExchange':
        if (kind === FeedType.HOME) {
          return <ExchangeFeedItem {...tx} />
        } else {
          return <GoldTransactionFeedItem {...tx} />
        }
    }
  }

  keyExtractor = (item: TransactionFeedFragment) => {
    return item.hash + item.timestamp.toString()
  }

  render() {
    const { kind, loading, error, data } = this.props

    if (error) {
      Logger.error(TAG, 'Failure while loading transaction feed', error)
      return <NoActivity kind={kind} loading={loading} error={error} />
    }

    if (data && data.length > 0) {
      return <FlatList data={data} keyExtractor={this.keyExtractor} renderItem={this.renderItem} />
    } else {
      return <NoActivity kind={kind} loading={loading} error={error} />
    }
  }
}

export default connect<StateProps, {}, {}, RootState>(mapStateToProps)(TransactionFeed)
