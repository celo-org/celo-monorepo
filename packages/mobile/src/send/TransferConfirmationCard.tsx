import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import Link from '@celo/react-components/components/Link'
import colors from '@celo/react-components/styles/colors'
import { fontStyles } from '@celo/react-components/styles/fonts'
import { componentStyles } from '@celo/react-components/styles/styles'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import BigNumber from 'bignumber.js'
import * as React from 'react'
import { Trans, WithTranslation } from 'react-i18next'
import { Image, StyleSheet, Text, View } from 'react-native'
import { MoneyAmount, TokenTransactionType } from 'src/apollo/types'
import Avatar from 'src/components/Avatar'
import CurrencyDisplay, { DisplayType, FormatType } from 'src/components/CurrencyDisplay'
import { FAQ_LINK } from 'src/config'
import { Namespaces, withTranslation } from 'src/i18n'
import { faucetIcon } from 'src/images/Images'
import { LocalCurrencyCode } from 'src/localCurrency/consts'
import { useLocalCurrencyCode } from 'src/localCurrency/hooks'
import { Recipient } from 'src/recipients/recipient'
import { navigateToURI } from 'src/utils/linking'
import { ExtractProps } from 'src/utils/typescript'

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

interface OwnProps {
  addressHasChanged: boolean
}

type Props = TransferConfirmationCardProps & WithTranslation & OwnProps

// Content placed in a ReviewFrame
// Differs from TransferReviewCard which is used during Send flow, this is for completed txs
const onPressGoToFaq = () => {
  navigateToURI(FAQ_LINK)
}

function Amount(props: ExtractProps<typeof CurrencyDisplay>) {
  const localCurrencyCode = useLocalCurrencyCode()

  const { amount } = props
  const showDollarAmount =
    amount.currencyCode === CURRENCIES[CURRENCY_ENUM.DOLLAR].code &&
    localCurrencyCode !== LocalCurrencyCode.USD

  return (
    <View>
      <CurrencyDisplay type={DisplayType.Big} hideSign={true} {...props} />
      {showDollarAmount && (
        <Text style={style.dollarAmount}>
          <Trans
            i18nKey="celoDollarAmount"
            ns={Namespaces.sendFlow7}
            count={new BigNumber(amount.value).absoluteValue().toNumber()}
          >
            <CurrencyDisplay
              amount={amount}
              showLocalAmount={false}
              hideSign={true}
              hideSymbol={true}
            />{' '}
            Celo Dollars
          </Trans>
        </Text>
      )}
    </View>
  )
}

const renderTopSection = (props: Props) => {
  const { t, address, recipient, type, e164PhoneNumber, addressHasChanged } = props
  if (
    type === TokenTransactionType.VerificationFee ||
    type === TokenTransactionType.NetworkFee ||
    type === TokenTransactionType.Faucet
  ) {
    return <Image source={faucetIcon} style={style.icon} />
  } else {
    return (
      <View>
        {addressHasChanged && (
          <Text testID={'transferAddressChanged'}>{t('transferAddressChanged')}</Text>
        )}
        <Avatar
          recipient={recipient}
          address={address}
          e164Number={e164PhoneNumber}
          iconSize={iconSize}
        />
      </View>
    )
  }
}

const renderAmountSection = (props: Props) => {
  const { amount, type } = props

  switch (type) {
    case TokenTransactionType.InviteSent: // fallthrough
    case TokenTransactionType.InviteReceived:
      return null
    case TokenTransactionType.NetworkFee:
      return <Amount amount={amount} formatType={FormatType.NetworkFeePrecise} />
    default:
      return <Amount amount={amount} />
  }
}

const renderBottomSection = (props: Props) => {
  const { t, amount, comment, type } = props

  if (type === TokenTransactionType.VerificationFee) {
    return <Text style={style.pSmall}>{t('receiveFlow8:verificationMessage')}</Text>
  } else if (type === TokenTransactionType.Faucet) {
    return (
      <Text style={style.pSmall}>
        <Trans i18nKey="receiveFlow8:receivedAmountFromCelo">
          You received <CurrencyDisplay amount={amount} /> from Celo!
        </Trans>
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

        <Amount amount={amount} />
      </View>
    )
  } else if (comment) {
    // When we want to add more info to the send tx drilldown, that will go here
    return <Text style={[style.pSmall, componentStyles.paddingTop5]}>{comment}</Text>
  }
}

export function TransferConfirmationCard(props: Props) {
  return (
    <View style={style.container}>
      {renderTopSection(props)}
      {renderAmountSection(props)}
      {renderBottomSection(props)}
    </View>
  )
}

const style = StyleSheet.create({
  container: {
    marginVertical: 20,
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
  dollarAmount: {
    ...fontStyles.light,
    fontSize: 14,
    color: '#B0B5B9',
    alignSelf: 'center',
    marginBottom: 20,
    marginTop: -10,
  },
})

export default withTranslation(Namespaces.sendFlow7)(TransferConfirmationCard)
