import BigNumber from 'bignumber.js'
import gql from 'graphql-tag'
import * as React from 'react'
import { Query, QueryResult } from 'react-apollo'
import { connect } from 'react-redux'
import { MoneyAmount, Token, TokenTransactionType, UserTransactionsQuery } from 'src/apollo/types'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { SENTINEL_INVITE_COMMENT } from 'src/invite/actions'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { getLocalCurrencyCode, getLocalCurrencyExchangeRate } from 'src/localCurrency/selectors'
import { RootState } from 'src/redux/reducers'
import { newTransactionsInFeed } from 'src/transactions/actions'
import { knownFeedTransactionsSelector, KnownFeedTransactionsType } from 'src/transactions/reducer'
import TransactionFeed, { FeedItem, FeedType } from 'src/transactions/TransactionFeed'
import { getNewTxsFromUserTxQuery, getTxsFromUserTxQuery } from 'src/transactions/transferFeedUtils'
import {
  ExchangeStandby,
  StandbyTransaction,
  TransactionStatus,
  TransferStandby,
} from 'src/transactions/types'
import Logger from 'src/utils/Logger'
import { currentAccountSelector } from 'src/web3/selectors'

const TAG = 'transactions/TransactionsList'
// Query poll interval
export const POLL_INTERVAL = 10000 // 10 secs

interface OwnProps {
  currency: CURRENCY_ENUM
}

interface StateProps {
  address?: string | null
  standbyTransactions: StandbyTransaction[]
  localCurrencyCode: LocalCurrencyCode
  localCurrencyExchangeRate: string | null | undefined
  knownFeedTransactions: KnownFeedTransactionsType
}

interface DispatchProps {
  newTransactionsInFeed: typeof newTransactionsInFeed
}

type Props = OwnProps & StateProps & DispatchProps

export const TRANSACTIONS_QUERY = gql`
  query UserTransactions($address: Address!, $token: Token!, $localCurrencyCode: String) {
    tokenTransactions(address: $address, token: $token, localCurrencyCode: $localCurrencyCode) {
      edges {
        node {
          ...TransactionFeed
        }
      }
    }
  }

  ${TransactionFeed.fragments.transaction}
`

const mapStateToProps = (state: RootState): StateProps => ({
  address: currentAccountSelector(state),
  standbyTransactions: state.transactions.standbyTransactions,
  localCurrencyCode: getLocalCurrencyCode(state),
  localCurrencyExchangeRate: getLocalCurrencyExchangeRate(state),
  knownFeedTransactions: knownFeedTransactionsSelector(state),
})

function resolveAmount(
  moneyAmount: Pick<MoneyAmount, 'value' | 'currencyCode'>,
  localCurrencyCode: LocalCurrencyCode,
  exchangeRate: string | null | undefined
) {
  if (!localCurrencyCode || !exchangeRate) {
    return { ...moneyAmount, localAmount: null }
  }

  return {
    ...moneyAmount,
    localAmount: {
      value: new BigNumber(moneyAmount.value).multipliedBy(exchangeRate),
      currencyCode: localCurrencyCode as string,
      exchangeRate,
    },
  }
}

function mapExchangeStandbyToFeedItem(
  standbyTx: ExchangeStandby,
  currency: CURRENCY_ENUM,
  localCurrencyCode: LocalCurrencyCode,
  localCurrencyExchangeRate: string | null | undefined
): FeedItem {
  const { type, hash, status, timestamp, inValue, inSymbol, outValue, outSymbol } = standbyTx

  const inAmount = {
    value: new BigNumber(inValue),
    currencyCode: CURRENCIES[inSymbol].code,
  }
  const outAmount = {
    value: new BigNumber(outValue),
    currencyCode: CURRENCIES[outSymbol].code,
  }

  const exchangeRate = new BigNumber(outAmount.value).dividedBy(inAmount.value)
  const localExchangeRate = new BigNumber(localCurrencyExchangeRate ?? 0)
  const makerLocalExchangeRate =
    inAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.DOLLAR].code
      ? localExchangeRate
      : exchangeRate.multipliedBy(localExchangeRate)
  const takerLocalExchangeRate =
    outAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.DOLLAR].code
      ? localExchangeRate
      : exchangeRate.pow(-1).multipliedBy(localExchangeRate)

  const makerAmount = resolveAmount(inAmount, localCurrencyCode, makerLocalExchangeRate.toString())
  const takerAmount = resolveAmount(outAmount, localCurrencyCode, takerLocalExchangeRate.toString())

  // Find amount relative to the queried currency
  const accountAmount = [makerAmount, takerAmount].find(
    (amount) => amount.currencyCode === CURRENCIES[currency].code
  )

  if (!accountAmount) {
    // This is not supposed to happen
    throw new Error('Unable to find amount relative to the queried currency')
  }

  return {
    __typename: 'TokenExchange',
    type,
    hash: hash ?? '',
    timestamp,
    status,
    amount: resolveAmount(
      {
        ...accountAmount,
        // Signed amount relative to the queried account currency
        value: new BigNumber(accountAmount.value).multipliedBy(
          accountAmount === makerAmount ? -1 : 1
        ),
      },
      localCurrencyCode,
      accountAmount.localAmount?.exchangeRate
    ),
    makerAmount,
    takerAmount,
  }
}

function mapTransferStandbyToFeedItem(
  standbyTx: TransferStandby,
  localCurrencyCode: LocalCurrencyCode,
  localCurrencyExchangeRate: string | null | undefined
): FeedItem {
  const { type, hash, status, timestamp, value, symbol, address, comment } = standbyTx

  return {
    __typename: 'TokenTransfer',
    type,
    hash: hash ?? '',
    timestamp,
    status,
    amount: resolveAmount(
      {
        // Signed amount relative to the queried account currency
        // Standby transfers are always outgoing
        value: new BigNumber(value).multipliedBy(-1),
        currencyCode: CURRENCIES[symbol].code,
      },
      localCurrencyCode,
      localCurrencyExchangeRate
    ),
    comment,
    address,
  }
}

function mapStandbyTransactionToFeedItem(
  currency: CURRENCY_ENUM,
  localCurrencyCode: LocalCurrencyCode,
  localCurrencyExchangeRate: string | null | undefined
) {
  return (standbyTx: StandbyTransaction): FeedItem => {
    if (standbyTx.type === TokenTransactionType.Exchange) {
      return mapExchangeStandbyToFeedItem(
        standbyTx,
        currency,
        localCurrencyCode,
        localCurrencyExchangeRate
      )
    }
    // Otherwise it's a transfer
    else {
      return mapTransferStandbyToFeedItem(standbyTx, localCurrencyCode, localCurrencyExchangeRate)
    }
  }
}

// TODO(jeanregisser): maybe move this to blockchain-api? and directly set the tx type to InviteSent for standbyTx
function mapInvite(tx: FeedItem): FeedItem {
  if (tx.__typename !== 'TokenTransfer' || tx.comment !== SENTINEL_INVITE_COMMENT) {
    return tx
  }

  if (tx.type === TokenTransactionType.Sent) {
    return { ...tx, type: TokenTransactionType.InviteSent }
  } else if (tx.type === TokenTransactionType.Received) {
    return { ...tx, type: TokenTransactionType.InviteReceived }
  }

  return tx
}

export class TransactionsList extends React.PureComponent<Props> {
  onTxsFetched = (data: UserTransactionsQuery | undefined) => {
    Logger.debug(TAG, 'onTxsFetched handler triggered')
    const newTxs = getNewTxsFromUserTxQuery(data, this.props.knownFeedTransactions)
    if (!newTxs || !newTxs.length) {
      return
    }

    this.props.newTransactionsInFeed(newTxs)
  }

  render() {
    const {
      address,
      currency,
      localCurrencyCode,
      localCurrencyExchangeRate,
      standbyTransactions,
    } = this.props

    const queryAddress = address || ''
    const token = currency === CURRENCY_ENUM.GOLD ? Token.CGld : Token.CUsd
    const kind = currency === CURRENCY_ENUM.GOLD ? FeedType.EXCHANGE : FeedType.HOME

    const UserTransactions = ({
      loading,
      error,
      data,
    }: QueryResult<UserTransactionsQuery | undefined>) => {
      const transactions = getTxsFromUserTxQuery(data).map((transaction) => ({
        ...transaction,
        status: TransactionStatus.Complete,
      }))

      // Filter out standby transactions that aren't for the queried currency or are already in the received transactions
      const queryDataTxHashes = new Set(transactions.map((tx) => tx.hash))
      const standbyTxs = standbyTransactions
        .filter((tx) => {
          const isForQueriedCurrency =
            (tx as TransferStandby).symbol === currency ||
            (tx as ExchangeStandby).inSymbol === currency ||
            (tx as ExchangeStandby).outSymbol === currency
          const notInQueryTxs =
            (!tx.hash || !queryDataTxHashes.has(tx.hash)) && tx.status !== TransactionStatus.Failed
          return isForQueriedCurrency && notInQueryTxs
        })
        .map(
          mapStandbyTransactionToFeedItem(currency, localCurrencyCode, localCurrencyExchangeRate)
        )

      const feedData = [...standbyTxs, ...transactions].map(mapInvite)

      return <TransactionFeed kind={kind} loading={loading} error={error} data={feedData} />
    }

    return (
      <Query
        query={TRANSACTIONS_QUERY}
        pollInterval={POLL_INTERVAL}
        variables={{ address: queryAddress, token, localCurrencyCode }}
        children={UserTransactions}
        onCompleted={this.onTxsFetched}
        // Adding this option because the onCompleted doesn't work properly without it.
        // It causes the onCompleted to trigger too often but that's okay.
        // https://github.com/apollographql/react-apollo/issues/2293
        notifyOnNetworkStatusChange={true}
      />
    )
  }
}

export default connect<StateProps, DispatchProps, OwnProps, RootState>(mapStateToProps, {
  newTransactionsInFeed,
})(TransactionsList)
