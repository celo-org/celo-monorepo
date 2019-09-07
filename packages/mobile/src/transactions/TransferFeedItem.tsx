import ContactCircle from '@celo/react-components/components/ContactCircle'
import Touchable from '@celo/react-components/components/Touchable'
import RewardIcon from '@celo/react-components/icons/RewardIcon'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import variables from '@celo/react-components/styles/variables'
import { decryptComment as decryptCommentRaw } from '@celo/utils/src/commentEncryption'
import BigNumber from 'bignumber.js'
import * as _ from 'lodash'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { HomeTransferFragment } from 'src/apollo/types'
import { DEFAULT_TESTNET, LOCAL_CURRENCY_SYMBOL } from 'src/config'
import { features } from 'src/flags'
import { CURRENCIES, CURRENCY_ENUM, resolveCurrency } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { coinsIcon, unknownUserIcon } from 'src/images/Images'
import { Invitees } from 'src/invite/actions'
import useLocalAmount from 'src/localCurrency/useLocalAmount'
import { getRecipientFromAddress, NumberToRecipient } from 'src/recipients/recipient'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import { TransactionStatus, TransactionTypes, TransferStandby } from 'src/transactions/reducer'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { formatFeedTime, getDatetimeDisplayString } from 'src/utils/time'

const TAG = 'transactions/TransferFeedItem.tsx'

const avatarSize = 40

type Props = (HomeTransferFragment | TransferStandby) &
  WithNamespaces & {
    status?: TransactionStatus
    invitees: Invitees
    addressToE164Number: AddressToE164NumberType
    recipientCache: NumberToRecipient
    commentKey: Buffer | null
  }

interface CurrencySymbolProps {
  color: string
  symbol: string
  direction: string
}

export function getCurrencyStyles(currency: CURRENCY_ENUM, type: string): CurrencySymbolProps {
  if (
    type === TransactionTypes.SENT ||
    type === TransactionTypes.VERIFICATION_FEE ||
    type === TransactionTypes.INVITE_SENT
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
    type === TransactionTypes.PAY_REQUEST
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

export function TransferFeedItem(props: Props) {
  const {
    t,
    value,
    address,
    timestamp,
    i18n,
    type,
    symbol,
    status,
    invitees,
    addressToE164Number,
    recipientCache,
  } = props

  const decryptComment = () => {
    return props.comment && props.commentKey && features.USE_COMMENT_ENCRYPTION
      ? decryptCommentRaw(props.comment, props.commentKey, type === TransactionTypes.SENT).comment
      : props.comment
  }

  const navigateToTransactionReview = () => {
    if (!Object.values(TransactionTypes).includes(type)) {
      Logger.error(TAG, 'Invalid transaction type')
      return
    }
    const transactionType: TransactionTypes = type as TransactionTypes

    // TODO: remove this when verification reward drilldown is supported
    if (transactionType === TransactionTypes.VERIFICATION_REWARD) {
      return
    }

    const recipient = getRecipientFromAddress(
      address,
      transactionType === TransactionTypes.INVITE_SENT ? invitees : addressToE164Number,
      recipientCache
    )

    navigateToPaymentTransferReview(type, timestamp, {
      address,
      comment: decryptComment(),
      currency: resolveCurrency(symbol),
      value: new BigNumber(value),
      recipient,
      type: transactionType,
      // fee TODO: add fee here.
    })
  }

  const localValue = useLocalAmount(value)
  let info: string | null = decryptComment()
  const timeFormatted = formatFeedTime(timestamp, i18n)
  const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
  const currencyStyle = getCurrencyStyles(resolveCurrency(symbol), type)
  const isPending = status === TransactionStatus.Pending

  let icon, title

  // TODO move this out to a seperate file, too much clutter here
  if (type === TransactionTypes.VERIFICATION_FEE) {
    icon = <Image source={coinsIcon} style={styles.image} />
    title = t('feedItemVerificationFeeTitle')
    info = t('feedItemVerificationFeeInfo')
  } else if (type === TransactionTypes.VERIFICATION_REWARD) {
    icon = (
      <View style={styles.image}>
        <RewardIcon height={38} />
      </View>
    )
    title = t('feedItemVerificationRewardTitle')
    info = t('feedItemVerificationRewardInfo')
  } else if (type === TransactionTypes.FAUCET) {
    icon = <Image source={coinsIcon} style={styles.image} />
    title = t('feedItemFaucetTitle')
    info = t('feedItemFaucetInfo', {
      context: !DEFAULT_TESTNET ? 'missingTestnet' : null,
      faucet: DEFAULT_TESTNET ? _.startCase(DEFAULT_TESTNET) : null,
    })
  } else if (type === TransactionTypes.INVITE_SENT) {
    icon = <Image source={coinsIcon} style={styles.image} />
    const inviteeE164Number = invitees[address]
    const inviteeRecipient = recipientCache[inviteeE164Number]
    title = t('feedItemInviteSentTitle')
    info = t('feedItemInviteSentInfo', {
      context: !inviteeE164Number ? 'missingInviteeDetails' : null,
      nameOrNumber: inviteeRecipient ? inviteeRecipient.displayName : inviteeE164Number,
    })
  } else if (type === TransactionTypes.INVITE_RECEIVED) {
    icon = <Image source={coinsIcon} style={styles.image} />
    title = t('feedItemInviteReceivedTitle')
    info = t('feedItemInviteReceivedInfo')
  } else {
    const recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)
    const shortAddr = address.substring(0, 8)

    if (recipient) {
      title = recipient.displayName
    } else if (type === TransactionTypes.RECEIVED) {
      title = t('feedItemReceivedTitle', { context: 'missingSenderDetails', address: shortAddr })
    } else if (type === TransactionTypes.SENT) {
      title = t('feedItemSentTitle', { context: 'missingReceiverDetails', address: shortAddr })
    } else {
      // Fallback to just using the type
      title = _.capitalize(t(_.camelCase(type)))
    }
    icon = (
      <ContactCircle address={address} size={avatarSize}>
        {!recipient ? <Image source={unknownUserIcon} style={styles.image} /> : null}
      </ContactCircle>
    )
  }

  return (
    <Touchable onPress={navigateToTransactionReview}>
      <View style={styles.container}>
        <View style={styles.iconContainer}>{icon}</View>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={[fontStyles.semiBold, styles.title]}>{title}</Text>
            <Text
              style={[
                currencyStyle.direction === '-'
                  ? fontStyles.activityCurrencySent
                  : fontStyles.activityCurrencyReceived,
                styles.amount,
              ]}
            >
              {currencyStyle.direction}
              {getMoneyDisplayValue(props.value)}
            </Text>
          </View>
          {!!info && <Text style={[fontStyles.comment, styles.textInfo]}>{info}</Text>}
          <View style={[styles.statusContainer, !!info && styles.statusContainerUnderComment]}>
            {isPending && (
              <Text style={[fontStyles.bodySmall, styles.transactionStatus]}>
                <Text style={[fontStyles.bodySmallBold, styles.textPending]}>
                  {t('confirmingPayment')}
                </Text>
                {' ' + timeFormatted}
              </Text>
            )}
            {status === TransactionStatus.Complete && (
              <Text style={[fontStyles.bodySmall, styles.transactionStatus]}>
                {dateTimeFormatted}
              </Text>
            )}
            {status === TransactionStatus.Failed && (
              <Text style={[fontStyles.bodySmall, styles.transactionStatus]}>
                <Text style={fontStyles.linkSmall}>{t('paymentFailed')}</Text>
                {' ' + timeFormatted}
              </Text>
            )}
            {LOCAL_CURRENCY_SYMBOL &&
              localValue && (
                <Text style={[fontStyles.bodySmall, styles.localAmount]}>
                  {t('localCurrencyValue', {
                    localValue: `${currencyStyle.direction}${getMoneyDisplayValue(localValue)}`,
                    localCurrencySymbol: LOCAL_CURRENCY_SYMBOL,
                  })}
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
  image: {
    height: avatarSize,
    width: avatarSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: variables.contentPadding,
  },
  titleContainer: {
    flexDirection: 'row',
    marginTop: 3,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.dark,
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
    fontSize: 13,
    lineHeight: 18,
    color: colors.celoGreen,
  },
  textInfo: {},
  transactionStatus: {
    color: '#BDBDBD',
  },
  localAmount: {
    marginLeft: 'auto',
    paddingLeft: 10,
    fontSize: 14,
    lineHeight: 18,
    color: '#BDBDBD',
  },
})

// @ts-ignore
export default withNamespaces(Namespaces.walletFlow5)(React.memo(TransferFeedItem))
