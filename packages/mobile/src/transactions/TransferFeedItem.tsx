import Touchable from '@celo/react-components/components/Touchable'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { StyleSheet, Text, View } from 'react-native'
import { HomeTransferFragment } from 'src/apollo/types'
import { CURRENCIES, CURRENCY_ENUM, resolveCurrency } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { Invitees } from 'src/invite/actions'
import {
  useDollarsToLocalAmount,
  useLocalCurrencyCode,
  useLocalCurrencySymbol,
} from 'src/localCurrency/hooks'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import { TransactionStatus, TransactionTypes, TransferStandby } from 'src/transactions/reducer'
import TransferFeedIcon from 'src/transactions/TransferFeedIcon'
import { decryptComment, getTransferFeedParams } from 'src/transactions/transferFeedUtils'
import { getMoneyDisplayValue, getNetworkFeeDisplayValue } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { formatFeedTime, getDatetimeDisplayString } from 'src/utils/time'

const TAG = 'transactions/TransferFeedItem.tsx'

type Props = (HomeTransferFragment | TransferStandby) &
  WithTranslation & {
    type: TransactionTypes
    status?: TransactionStatus
    invitees: Invitees
    addressToE164Number: AddressToE164NumberType
    recipientCache: NumberToRecipient
    commentKey: Buffer | null
    showLocalCurrency: boolean
  }

interface CurrencySymbolProps {
  color: string
  symbol: string
  direction: string
}

function getCurrencyStyles(currency: CURRENCY_ENUM, type: string): CurrencySymbolProps {
  if (
    type === TransactionTypes.SENT ||
    type === TransactionTypes.VERIFICATION_FEE ||
    type === TransactionTypes.INVITE_SENT ||
    type === TransactionTypes.ESCROW_SENT
  ) {
    return {
      color: colors.darkSecondary,
      symbol: CURRENCIES[currency].symbol,
      direction: '-',
    }
  }
  if (
    type === TransactionTypes.RECEIVED ||
    type === TransactionTypes.FAUCET ||
    type === TransactionTypes.VERIFICATION_REWARD ||
    type === TransactionTypes.INVITE_RECEIVED ||
    type === TransactionTypes.PAY_REQUEST ||
    type === TransactionTypes.ESCROW_RECEIVED
  ) {
    if (currency === CURRENCY_ENUM.DOLLAR) {
      return {
        color: colors.dark,
        symbol: CURRENCIES[CURRENCY_ENUM.DOLLAR].symbol,
        direction: '',
      }
    }
    if (currency === CURRENCY_ENUM.GOLD) {
      return {
        color: colors.celoGold,
        symbol: CURRENCIES[CURRENCY_ENUM.GOLD].symbol,
        direction: '',
      }
    }
  }

  Logger.warn(TAG, `Unsupported transaction type: ${type}`)
  return {
    color: colors.darkSecondary,
    symbol: '',
    direction: '',
  }
}

function navigateToTransactionReview({
  address,
  type,
  comment,
  commentKey,
  timestamp,
  value,
  symbol,
  invitees,
  addressToE164Number,
  recipientCache,
}: Props) {
  // TODO: remove this when verification reward drilldown is supported
  if (type === TransactionTypes.VERIFICATION_REWARD) {
    return
  }

  const recipient = getRecipientFromAddress(
    address,
    type === TransactionTypes.INVITE_SENT ? invitees : addressToE164Number,
    recipientCache
  )

  navigateToPaymentTransferReview(type, timestamp, {
    address,
    comment: decryptComment(comment, commentKey, type),
    currency: resolveCurrency(symbol),
    value: new BigNumber(value),
    recipient,
    type,
    // fee TODO: add fee here.
  })
}

export function TransferFeedItem(props: Props) {
  const onItemPress = () => {
    navigateToTransactionReview(props)
  }

  const {
    t,
    value,
    address,
    timestamp,
    i18n,
    type,
    comment,
    commentKey,
    symbol,
    status,
    invitees,
    addressToE164Number,
    recipientCache,
    showLocalCurrency,
  } = props

  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencySymbol = useLocalCurrencySymbol()
  const localValue = useDollarsToLocalAmount(value)
  const timeFormatted = formatFeedTime(timestamp, i18n)
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const currency = resolveCurrency(symbol)
  const currencyStyle = getCurrencyStyles(currency, type)
  const isPending = status === TransactionStatus.Pending
  const transactionValue =
    type === TransactionTypes.NETWORK_FEE
      ? getNetworkFeeDisplayValue(props.value)
      : showLocalCurrency && localCurrencyCode
      ? getMoneyDisplayValue(localValue || 0)
      : getMoneyDisplayValue(props.value)

  const { title, info, recipient } = getTransferFeedParams(
    type,
    t,
    invitees,
    recipientCache,
    address,
    addressToE164Number,
    comment,
    commentKey
  )

  return (
    <Touchable onPress={onItemPress}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <TransferFeedIcon type={type} recipient={recipient} address={address} />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <Text
              style={[
                currencyStyle.direction === '-'
                  ? fontStyles.activityCurrencySent
                  : {
                      ...fontStyles.activityCurrencyReceived,
                      color: currency === CURRENCY_ENUM.GOLD ? colors.celoGold : colors.celoGreen,
                    },
                styles.amount,
              ]}
            >
              {currencyStyle.direction}
              {showLocalCurrency && localCurrencySymbol}
              {transactionValue}
            </Text>
          </View>
          {!!info && <Text style={styles.info}>{info}</Text>}
          <View style={[styles.statusContainer, !!info && styles.statusContainerUnderComment]}>
            {isPending && (
              <Text style={styles.transactionStatus}>
                <Text style={styles.textPending}>{t('confirmingPayment')}</Text>
                {' ' + timeFormatted}
              </Text>
            )}
            {status === TransactionStatus.Complete && (
              <Text style={styles.transactionStatus}>{dateTimeFormatted}</Text>
            )}
            {status === TransactionStatus.Failed && (
              <Text style={styles.transactionStatus}>
                <Text style={styles.textStatusFailed}>{t('paymentFailed')}</Text>
                {' ' + timeFormatted}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Touchable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    padding: variables.contentPadding,
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: -1,
  },
  title: {
    ...fontStyles.semiBold,
    fontSize: 15,
    color: colors.dark,
  },
  info: {
    ...fontStyles.comment,
    marginTop: -2,
  },
  amount: {
    marginLeft: 'auto',
    paddingLeft: 10,
  },
  statusContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusContainerUnderComment: {
    marginTop: 8,
  },
  textPending: {
    ...fontStyles.bodySmallBold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.celoGreen,
  },
  transactionStatus: {
    ...fontStyles.bodySmall,
    color: colors.lightGray,
  },
  textStatusFailed: {
    ...fontStyles.semiBold,
    fontSize: 13,
    lineHeight: 17,
    color: colors.darkSecondary,
  },
  localAmount: {
    marginLeft: 'auto',
    paddingLeft: 10,
    fontSize: 14,
    lineHeight: 18,
    color: colors.lightGray,
  },
})

export default withTranslation(Namespaces.walletFlow5)(React.memo(TransferFeedItem))
