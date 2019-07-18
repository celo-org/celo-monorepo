import ContactCircle from '@celo/react-components/components/ContactCircle'
import Touchable from '@celo/react-components/components/Touchable'
import RewardIcon from '@celo/react-components/icons/RewardIcon'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { decryptComment as decryptCommentRaw } from '@celo/utils/src/commentEncryption'
import BigNumber from 'bignumber.js'
import * as _ from 'lodash'
import * as React from 'react'
import { withNamespaces, WithNamespaces } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { HomeTransferFragment } from 'src/apollo/types'
import { features } from 'src/flags'
import { CURRENCY_ENUM, resolveCurrency } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { faucetIcon, inviteVerifyFee } from 'src/images/Images'
import { Invitees } from 'src/invite/actions'
import { navigateToPaymentTransferReview } from 'src/transactions/actions'
import { TransactionStatus, TransactionTypes, TransferStandby } from 'src/transactions/reducer'
import { getMoneyDisplayValue } from 'src/utils/formatting'
import Logger from 'src/utils/Logger'
import { getRecipientFromAddress, NumberToRecipient } from 'src/utils/recipient'
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

export function getCurrencyStyles(currency: string, type: string): CurrencySymbolProps {
  if (
    type === TransactionTypes.SENT ||
    type === TransactionTypes.VERIFICATION_FEE ||
    type === TransactionTypes.INVITE_SENT
  ) {
    return {
      color: colors.darkSecondary,
      symbol: currency === CURRENCY_ENUM.DOLLAR ? '$' : '',
      direction: '',
    }
  }
  if (
    type === TransactionTypes.RECEIVED ||
    type === TransactionTypes.FAUCET ||
    type === TransactionTypes.VERIFICATION_REWARD ||
    type === TransactionTypes.INVITE_RECEIVED
  ) {
    if (currency === CURRENCY_ENUM.DOLLAR) {
      return {
        color: colors.celoGreen,
        symbol: '$',
        direction: '+',
      }
    }
    if (currency === CURRENCY_ENUM.GOLD) {
      return {
        color: colors.celoGold,
        symbol: '',
        direction: '+',
      }
    }
  }

  Logger.error(TAG, 'Unsupported Transaction Type In Feed')
  return {
    color: colors.darkSecondary,
    symbol: '',
    direction: '',
  }
}

export class TransferFeedItem extends React.PureComponent<Props> {
  decryptComment = (type: string) => {
    return this.props.comment && this.props.commentKey && features.USE_COMMENT_ENCRYPTION
      ? decryptCommentRaw(this.props.comment, this.props.commentKey, type === TransactionTypes.SENT)
          .comment
      : this.props.comment
  }

  navigateToTransactionReview = () => {
    const {
      address,
      timestamp,
      type,
      symbol,
      value,
      addressToE164Number,
      recipientCache,
    } = this.props

    if (!Object.values(TransactionTypes).includes(type)) {
      Logger.error(TAG, 'Invalid transaction type')
      return
    }
    const transactionType: TransactionTypes = type as TransactionTypes

    // TODO: remove this when verification reward drilldown is supported
    if (transactionType === TransactionTypes.VERIFICATION_REWARD) {
      return
    }

    const recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)

    const comment = this.decryptComment(type)
    navigateToPaymentTransferReview(type, timestamp, {
      address,
      comment,
      currency: resolveCurrency(symbol),
      value: new BigNumber(value),
      recipient,
      type: transactionType,
      // fee TODO: add fee here.
    })
  }

  renderRewardIcon() {
    return (
      <View style={styles.image}>
        <RewardIcon height={38} />
      </View>
    )
  }

  render() {
    const {
      t,
      address,
      timestamp,
      i18n,
      type,
      symbol,
      status,
      invitees,
      addressToE164Number,
      recipientCache,
    } = this.props
    let comment: string | null = this.decryptComment(type)
    const timeFormatted = formatFeedTime(timestamp, i18n)
    const dateTimeFormatted = getDatetimeDisplayString(timestamp, t, i18n)
    const currencyStyle = getCurrencyStyles(symbol, type)
    const isPending = status === TransactionStatus.Pending
    const opacityStyle = { opacity: isPending ? 0.3 : 1 }

    let contactImage, fullName

    // TODO move this out to a seperate file, too much clutter here
    if (type === TransactionTypes.VERIFICATION_FEE) {
      contactImage = <Image source={faucetIcon} style={styles.image} />
      fullName = t('verificationFee')
      comment = null
    } else if (type === TransactionTypes.VERIFICATION_REWARD) {
      contactImage = this.renderRewardIcon()
      fullName = t('verifierReward')
      comment = null
    } else if (type === TransactionTypes.FAUCET) {
      contactImage = <Image source={faucetIcon} style={styles.image} />
      fullName = 'Celo'
      comment = null
    } else if (type === TransactionTypes.INVITE_SENT) {
      contactImage = <Image source={inviteVerifyFee} style={styles.image} />
      const inviteeE164Number = invitees[address]
      const inviteeRecipient = recipientCache[inviteeE164Number]
      fullName = inviteeE164Number
        ? `${t('invited')} ${inviteeRecipient ? inviteeRecipient.displayName : inviteeE164Number}`
        : t('inviteFlow11:inviteSent')
      comment = null
    } else if (type === TransactionTypes.INVITE_RECEIVED) {
      contactImage = <Image source={inviteVerifyFee} style={styles.image} />
      fullName = t('inviteFlow11:inviteReceived')
      comment = null
    } else {
      const recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)
      fullName = recipient ? recipient.displayName : _.capitalize(t(type.toLowerCase()))
      contactImage = <ContactCircle address={address} size={avatarSize} />
    }

    return (
      <Touchable onPress={this.navigateToTransactionReview}>
        <View style={styles.container}>
          <View style={[styles.iconContainer, opacityStyle]}>{contactImage}</View>
          <View style={styles.contentContainer}>
            <View style={styles.textContainer}>
              <View style={opacityStyle}>
                <Text style={fontStyles.bodySmallSemiBold}>{fullName}</Text>
                {!!comment && (
                  <Text style={[fontStyles.comment, styles.textComment]}>{comment}</Text>
                )}
              </View>
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
            </View>
            <View style={[styles.amountContainer, opacityStyle]}>
              <Text style={[fontStyles.activityCurrency, { color: currencyStyle.color }]}>
                {currencyStyle.direction}
                {currencyStyle.symbol}
                {getMoneyDisplayValue(this.props.value)}
              </Text>
            </View>
          </View>
        </View>
      </Touchable>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
    paddingTop: 20,
    paddingLeft: 10,
  },
  iconContainer: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
    borderBottomWidth: 1,
    borderColor: colors.listBorder,
    paddingRight: 10,
  },
  amountContainer: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  image: {
    height: avatarSize,
    width: avatarSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textPending: {
    fontSize: 13,
    lineHeight: 18,
  },
  textComment: {
    paddingTop: 10,
  },
  transactionStatus: {
    paddingTop: 25,
    paddingBottom: 10,
  },
})

export default withNamespaces(Namespaces.walletFlow5)(TransferFeedItem)
