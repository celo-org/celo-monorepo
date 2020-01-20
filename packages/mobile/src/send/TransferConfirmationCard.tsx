import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import Link from '@celo/react-components/components/Link'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { MoneyAmount, TokenTransactionType } from 'src/apollo/types'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType } from 'src/components/CurrencyDisplay'
import { FAQ_LINK } from 'src/config'
import { CURRENCIES, CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { faucetIcon } from 'src/images/Images'
import { Recipient } from 'src/recipients/recipient'
import { getMoneyDisplayValue, getNetworkFeeDisplayValue } from 'src/utils/formatting'
import { navigateToURI } from 'src/utils/linking'

const iconSize = 40

export interface TransferConfirmationCardProps {
  address?: string
  comment?: string | null
  amount: MoneyAmount
  type: TokenTransactionType
  e164PhoneNumber?: string
  dollarBalance?: BigNumber
  recipient?: Recipient
}

type Props = TransferConfirmationCardProps & WithTranslation

// Bordered content placed in a ReviewFrame
// Differs from TransferReviewCard which is used during Send flow, this is for completed txs
const onPressGoToFaq = () => {
  navigateToURI(FAQ_LINK)
}

const renderTopSection = (props: Props) => {
  const { address, recipient, type, e164PhoneNumber } = props
  if (
    type === TokenTransactionType.VerificationFee ||
    type === TokenTransactionType.NetworkFee ||
    type === TokenTransactionType.Faucet
  ) {
    return <Image source={faucetIcon} style={style.icon} />
  } else {
    return (
      <Avatar
        recipient={recipient}
        address={address}
        e164Number={e164PhoneNumber}
        iconSize={iconSize}
      />
    )
  }
}

const formatNetworkFee = (value: BigNumber.Value) => getNetworkFeeDisplayValue(value, true)

const renderAmountSection = (props: Props) => {
  const { amount, type } = props

  switch (type) {
    case TokenTransactionType.InviteSent: // fallthrough
    case TokenTransactionType.InviteReceived:
      return null
    case TokenTransactionType.NetworkFee:
      return (
        <CurrencyDisplay
          type={DisplayType.Big}
          amount={amount}
          formatAmount={formatNetworkFee}
          useColors={false}
        />
      )
    default:
      return <CurrencyDisplay type={DisplayType.Big} amount={amount} useColors={false} />
  }
}

const renderBottomSection = (props: Props) => {
  const { t, amount, comment, type } = props

  const currency =
    amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code
      ? CURRENCY_ENUM.GOLD
      : CURRENCY_ENUM.DOLLAR

  if (type === TokenTransactionType.VerificationFee) {
    return <Text style={style.pSmall}>{t('receiveFlow8:verificationMessage')}</Text>
  } else if (type === TokenTransactionType.Faucet) {
    return (
      <Text style={style.pSmall}>
        {t('receiveFlow8:receivedAmountFromCelo.0')}
        {CURRENCIES[currency].symbol}
        {getMoneyDisplayValue(amount.value)}
        {t('receiveFlow8:receivedAmountFromCelo.1')}
      </Text>
    )
  } else if (type === TokenTransactionType.NetworkFee) {
    return (
      <View>
        <Text style={style.pSmall}>
          {t('walletFlow5:networkFeeExplanation.0')}
          <Link onPress={onPressGoToFaq}>{t('walletFlow5:networkFeeExplanation.1')}</Link>
        </Text>
      </View>
    )
  } else if (
    type === TokenTransactionType.InviteSent ||
    type === TokenTransactionType.InviteReceived
  ) {
    return (
      <View style={style.bottomContainer}>
        <View style={style.inviteLine}>
          <HorizontalLine />
        </View>
        <Text style={style.inviteTitle}>{t('inviteFlow11:inviteFee')}</Text>
        {type === TokenTransactionType.InviteSent ? (
          <Text style={style.pSmall}>{t('inviteFlow11:whySendFees')}</Text>
        ) : (
          <Text style={style.pSmall}>{t('inviteFlow11:whyReceiveFees')}</Text>
        )}

        <CurrencyDisplay type={DisplayType.Big} amount={amount} useColors={false} />
      </View>
    )
  } else if (comment) {
    // When we want to add more info to the send tx drilldown, that will go here
    return <Text style={[style.pSmall, componentStyles.paddingTop5]}>{comment}</Text>
  }
}

export function TransferConfirmationCard(props: Props) {
  return (
    <View style={[componentStyles.roundedBorder, style.container]}>
      {renderTopSection(props)}
      {renderAmountSection(props)}
      {renderBottomSection(props)}
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginVertical: 20,
    minWidth: variables.width * 0.75,
  },
  bottomContainer: {
    marginTop: 5,
  },
  icon: {
    height: iconSize,
    width: iconSize,
    marginVertical: 20,
    alignSelf: 'center',
  },
  pSmall: {
    fontSize: 14,
    color: colors.darkSecondary,
    ...fontStyles.light,
    lineHeight: 18,
    textAlign: 'center',
  },
  inviteLine: {
    marginVertical: 20,
  },
  inviteTitle: {
    ...fontStyles.pCurrency,
    textAlign: 'center',
    marginBottom: 5,
  },
})

export default withTranslation(Namespaces.sendFlow7)(TransferConfirmationCard)
