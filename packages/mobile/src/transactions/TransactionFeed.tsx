import SectionHead from '@celo/react-components/components/SectionHead'
import { ApolloError } from 'apollo-boost'
import gql from 'graphql-tag'
import React, { useMemo } from 'react'
import { FlatList, SectionList, SectionListData } from 'react-native'
import { useSelector } from 'react-redux'
import { TransactionFeedFragment } from 'src/apollo/types'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { inviteesSelector } from 'src/invite/reducer'
import { recipientCacheSelector } from 'src/recipients/reducer'
import { RootState } from 'src/redux/reducers'
import CeloTransferFeedItem from 'src/transactions/CeloTransferFeedItem'
import ExchangeFeedItem from 'src/transactions/ExchangeFeedItem'
import GoldTransactionFeedItem from 'src/transactions/GoldTransactionFeedItem'
import NoActivity from 'src/transactions/NoActivity'
import { recentTxRecipientsCacheSelector } from 'src/transactions/reducer'
import TransferFeedItem from 'src/transactions/TransferFeedItem'
import { TransactionStatus } from 'src/transactions/types'
import { groupFeedItemsInSections } from 'src/transactions/utils'
import Logger from 'src/utils/Logger'
import { dataEncryptionKeySelector } from 'src/web3/selectors'

const TAG = 'transactions/TransactionFeed'

export enum FeedType {
  HOME = 'home',
  EXCHANGE = 'exchange',
}

export type FeedItem = TransactionFeedFragment & {
  status: TransactionStatus // for standby transactions
}

interface Props {
  kind: FeedType
  loading: boolean
  error: ApolloError | undefined
  data: FeedItem[] | undefined
}

function TransactionFeed({ kind, loading, error, data }: Props) {
  const commentKey = useSelector(dataEncryptionKeySelector)
  const addressToE164Number = useSelector((state: RootState) => state.identity.addressToE164Number)
  const recipientCache = useSelector(recipientCacheSelector)
  const recentTxRecipientsCache = useSelector(recentTxRecipientsCacheSelector)
  const invitees = useSelector(inviteesSelector)

  const renderItem = ({ item: tx }: { item: FeedItem; index: number }) => {
    switch (tx.__typename) {
      case 'TokenTransfer':
        if (tx.amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code) {
          return <CeloTransferFeedItem {...tx} />
        } else {
          return (
            <TransferFeedItem
              addressToE164Number={addressToE164Number}
              recipientCache={recipientCache}
              recentTxRecipientsCache={recentTxRecipientsCache}
              invitees={invitees}
              commentKey={commentKey}
              {...tx}
            />
          )
        }
      case 'TokenExchange':
        if (kind === FeedType.HOME) {
          return <ExchangeFeedItem {...tx} />
        } else {
          return <GoldTransactionFeedItem {...tx} />
        }
    }
  }

  const renderSectionHeader = (info: { section: SectionListData<FeedItem> }) => (
    <SectionHead text={info.section.title} />
  )

  const keyExtractor = (item: TransactionFeedFragment) => {
    return item.hash + item.timestamp.toString()
  }

  const sections = useMemo(() => {
    // Only compute sections for home screen.
    if (!data || data.length === 0 || kind !== FeedType.HOME) {
      return []
    }
    return groupFeedItemsInSections(data)
  }, [kind, data])

  if (error) {
    // Log an error, but continue to show any events we have cached.
    Logger.error(TAG, 'Failure while loading transaction feed', error)
  }

  if (!data || data.length === 0) {
    return <NoActivity kind={kind} loading={loading} error={error} />
  }

  if (kind === FeedType.HOME) {
    return (
      <SectionList
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        sections={sections}
        keyExtractor={keyExtractor}
        keyboardShouldPersistTaps="always"
      />
    )
  } else {
    return <FlatList data={data} keyExtractor={keyExtractor} renderItem={renderItem} />
  }
}

export const TransactionFeedFragments = {
  transaction: gql`
    fragment TransactionFeed on TokenTransaction {
      ...ExchangeItem
      ...TransferItem
    }

    ${ExchangeFeedItem.fragments.exchange}
    ${TransferFeedItem.fragments.transfer}
  `,
}

// TODO: Meassure performance of this screen and decide if we need to optimize the number of renders.
// Right now |data| always changes (returns a different ref) which causes many extra renders.
export default TransactionFeed
