import gql from 'graphql-tag'
import * as React from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { Image, StyleSheet } from 'react-native'
import { ExchangeItemFragment } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { transactionExchange } from 'src/images/Images'
import { navigateToExchangeReview } from 'src/transactions/actions'
import TransactionFeedItem from 'src/transactions/TransactionFeedItem'
import { TransactionStatus } from 'src/transactions/types'

type Props = ExchangeItemFragment & {
  status: TransactionStatus
}

export function ExchangeFeedItem(props: Props) {
  const { t } = useTranslation(Namespaces.walletFlow5)
  const { type, amount, makerAmount, takerAmount, status, timestamp } = props

  const onPress = () => {
    navigateToExchangeReview(timestamp, {
      makerAmount,
      takerAmount,
    })
  }

  const boughtGold = takerAmount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
  const icon = transactionExchange
  const goldAmount = boughtGold ? takerAmount : makerAmount

  return (
    <TransactionFeedItem
      type={type}
      amount={amount}
      title={t('feedItemExchangeTitle')}
      info={
        <Trans
          i18nKey="feedItemExchangeInfo"
          ns={Namespaces.walletFlow5}
          tOptions={{ context: boughtGold ? 'boughtGold' : 'soldGold' }}
        >
          <CurrencyDisplay amount={goldAmount} showLocalAmount={false} hideSymbol={true} />
        </Trans>
      }
      icon={<Image source={icon} style={styles.image} resizeMode="contain" />}
      timestamp={timestamp}
      status={status}
      onPress={onPress}
    />
  )
}

ExchangeFeedItem.fragments = {
  exchange: gql`
    fragment ExchangeItem on TokenExchange {
      __typename
      type
      hash
      amount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      timestamp
      takerAmount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
      makerAmount {
        value
        currencyCode
        localAmount {
          value
          currencyCode
          exchangeRate
        }
      }
    }
  `,
}

const styles = StyleSheet.create({
  imageContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    width: 40,
  },
  image: {
    height: 40,
    width: 40,
  },
})

export default ExchangeFeedItem
