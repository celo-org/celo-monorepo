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
import { DEFAULT_TESTNET } from 'src/config'
import { features } from 'src/flags'
import { CURRENCIES, CURRENCY_ENUM, resolveCurrency } from 'src/geth/consts'
import { Namespaces } from 'src/i18n'
import { AddressToE164NumberType } from 'src/identity/reducer'
import { coinsIcon, unknownUserIcon } from 'src/images/Images'
import { Invitees } from 'src/invite/actions'
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
    const currencyStyle = getCurrencyStyles(resolveCurrency(symbol), type)
    const isPending = status === TransactionStatus.Pending
    const opacityStyle = { opacity: isPending ? 0.3 : 1 }

    let icon, title

    // TODO move this out to a seperate file, too much clutter here
    if (type === TransactionTypes.VERIFICATION_FEE) {
      icon = <Image source={coinsIcon} style={styles.image} />
      title = 'Celo'
      comment = t('verificationFee')
    } else if (type === TransactionTypes.VERIFICATION_REWARD) {
      icon = this.renderRewardIcon()
      title = 'Celo'
      comment = t('verifierReward')
    } else if (type === TransactionTypes.FAUCET) {
      icon = <Image source={coinsIcon} style={styles.image} />
      title = 'Celo'
      comment = DEFAULT_TESTNET ? `${_.startCase(DEFAULT_TESTNET)} Faucet` : 'Faucet'
    } else if (type === TransactionTypes.INVITE_SENT) {
      icon = <Image source={coinsIcon} style={styles.image} />
      const inviteeE164Number = invitees[address]
      const inviteeRecipient = recipientCache[inviteeE164Number]
      title = 'Celo'
      comment = inviteeE164Number
        ? `${t('invited')} ${inviteeRecipient ? inviteeRecipient.displayName : inviteeE164Number}`
        : t('inviteFlow11:inviteSent')
    } else if (type === TransactionTypes.INVITE_RECEIVED) {
      icon = <Image source={coinsIcon} style={styles.image} />
      title = 'Celo'
      comment = t('inviteFlow11:inviteReceived')
    } else {
      const recipient = getRecipientFromAddress(address, addressToE164Number, recipientCache)
      const shortAddr = address.substring(0, 8)

      if (recipient) {
        title = recipient.displayName
      } else if (type === TransactionTypes.RECEIVED) {
        title = t('receivedFrom', { address: shortAddr })
      } else if (type === TransactionTypes.SENT) {
        title = t('sentTo', { address: shortAddr })
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
      <Touchable onPress={this.navigateToTransactionReview}>
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
                {getMoneyDisplayValue(this.props.value)}
              </Text>
            </View>
            {!!comment && <Text style={[fontStyles.comment, styles.textComment]}>{comment}</Text>}
            <View style={[styles.statusContainer, !!comment && styles.statusContainerUnderComment]}>
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
              <Text style={[fontStyles.bodySmall, styles.localAmount]}>
                {currencyStyle.direction}
                {`${getMoneyDisplayValue(this.props.value)} MXN`}
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
  },
  textComment: {
    // paddingTop: 10,
  },
  transactionStatus: {
    color: '#BDBDBD',
  },
  // localAmountContainer: {},
  localAmount: {
    marginLeft: 'auto',
    paddingLeft: 10,
    fontSize: 14,
    lineHeight: 18,
    color: '#BDBDBD',
  },
})

// @ts-ignore
export default withNamespaces(Namespaces.walletFlow5)(TransferFeedItem)
