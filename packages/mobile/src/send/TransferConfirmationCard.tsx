import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import Link from '@celo/react-components/components/Link'
import { MoneyAmount } from '@celo/react-components/components/MoneyAmount'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import variables from '@celo/react-components/styles/variables'
import { CURRENCIES } from '@celo/utils'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { WithTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import Avatar from 'src/components/Avatar'
import { FAQ_LINK } from 'src/config'
import { CURRENCY_ENUM } from 'src/geth/consts'
import { Namespaces, withTranslation } from 'src/i18n'
import { faucetIcon } from 'src/images/Images'
import {
  useDollarsToLocalAmount,
  useLocalCurrencyCode,
  useLocalCurrencySymbol,
} from 'src/localCurrency/hooks'
import { Recipient } from 'src/recipients/recipient'
import { TransactionTypes } from 'src/transactions/reducer'
import { getMoneyDisplayValue, getNetworkFeeDisplayValue } from 'src/utils/formatting'
import { navigateToURI } from 'src/utils/linking'

const iconSize = 40

export interface TransferConfirmationCardProps {
  address?: string
  comment?: string
  value: BigNumber
  currency: CURRENCY_ENUM
  type: TransactionTypes
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
    type === TransactionTypes.VERIFICATION_FEE ||
    type === TransactionTypes.NETWORK_FEE ||
    type === TransactionTypes.FAUCET
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

const renderAmountSection = (props: Props) => {
  const { currency, type, value } = props

  // tslint:disable react-hooks-nesting
  const localCurrencyCode = useLocalCurrencyCode()
  const localCurrencySymbol = useLocalCurrencySymbol()
  const localValue = useDollarsToLocalAmount(value) || 0
  // tslint:enable react-hooks-nesting
  const transactionValue = getMoneyDisplayValue(
    currency === CURRENCY_ENUM.DOLLAR && localCurrencyCode ? localValue : value
  )

  switch (type) {
    case TransactionTypes.INVITE_SENT: // fallthrough
    case TransactionTypes.INVITE_RECEIVED:
      return null
    case TransactionTypes.NETWORK_FEE:
      return (
        <MoneyAmount
          symbol={CURRENCIES[currency].symbol}
          amount={getNetworkFeeDisplayValue(value, true)}
        />
      )
    default:
      return (
        <MoneyAmount
          symbol={
            (currency === CURRENCY_ENUM.DOLLAR && localCurrencySymbol) ||
            CURRENCIES[currency].symbol
          }
          amount={transactionValue}
        />
      )
  }
}

const renderBottomSection = (props: Props) => {
  const { t, currency, comment, type, value } = props

  if (type === TransactionTypes.VERIFICATION_FEE) {
    return <Text style={style.pSmall}>{t('receiveFlow8:verificationMessage')}</Text>
  } else if (type === TransactionTypes.FAUCET) {
    return (
      <Text style={style.pSmall}>
        {t('receiveFlow8:receivedAmountFromCelo.0')}
        {CURRENCIES[currency].symbol}
        {getMoneyDisplayValue(props.value)}
        {t('receiveFlow8:receivedAmountFromCelo.1')}
      </Text>
    )
  } else if (type === TransactionTypes.NETWORK_FEE) {
    return (
      <View>
        <Text style={style.pSmall}>
          {t('walletFlow5:networkFeeExplanation.0')}
          <Link onPress={onPressGoToFaq}>{t('walletFlow5:networkFeeExplanation.1')}</Link>
        </Text>
      </View>
    )
  } else if (type === TransactionTypes.INVITE_SENT || type === TransactionTypes.INVITE_RECEIVED) {
    return (
      <View style={style.bottomContainer}>
        <View style={style.inviteLine}>
          <HorizontalLine />
        </View>
        <Text style={style.inviteTitle}>{t('inviteFlow11:inviteFee')}</Text>
        {type === TransactionTypes.INVITE_SENT ? (
          <Text style={style.pSmall}>{t('inviteFlow11:whySendFees')}</Text>
        ) : (
          <Text style={style.pSmall}>{t('inviteFlow11:whyReceiveFees')}</Text>
        )}

        <MoneyAmount symbol={CURRENCIES[currency].symbol} amount={getMoneyDisplayValue(value)} />
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
