import ContactCircle from '@celo/react-components/components/ContactCircle'
import HorizontalLine from '@celo/react-components/components/HorizontalLine'
import Link from '@celo/react-components/components/Link'
import { CURRENCIES, CURRENCY_ENUM } from '@celo/utils/src'
import BigNumber from 'bignumber.js'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { MoneyAmount, TokenTransactionType } from 'src/apollo/types'
import CurrencyDisplay from 'src/components/CurrencyDisplay'
import FeeDrawer from 'src/components/FeeDrawer'
import LineItemRow from 'src/components/LineItemRow.v2'
import TotalLineItem from 'src/components/TotalLineItem.v2'
import { FAQ_LINK } from 'src/config'
import { Namespaces } from 'src/i18n'
import { getInvitationVerificationFeeInDollars } from 'src/invite/saga'
import { getRecipientThumbnail, Recipient } from 'src/recipients/recipient'
import BottomText from 'src/transactions/BottomText'
import CommentSection from 'src/transactions/CommentSection'
import TransferAvatars from 'src/transactions/TransferAvatars'
import UserSection from 'src/transactions/UserSection'
import { navigateToURI } from 'src/utils/linking'

export interface TransferConfirmationCardProps {
  address?: string
  comment?: string | null
  amount: MoneyAmount
  type: TokenTransactionType
  e164PhoneNumber?: string
  dollarBalance?: BigNumber
  recipient?: Recipient
}

type Props = TransferConfirmationCardProps & {
  addressHasChanged: boolean
}

const onPressGoToFaq = () => {
  navigateToURI(FAQ_LINK)
}

function FaucetContent({ amount }: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const totalAmount = amount

  return (
    <>
      <TotalLineItem amount={totalAmount} />
      <BottomText>{t('receiveFlow8:receivedAmountFromCelo')}</BottomText>
    </>
  )
}

function VerificationContent({ amount }: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const totalAmount = amount

  return (
    <>
      <TotalLineItem amount={totalAmount} hideSign={true} />
      <BottomText>{t('receiveFlow8:verificationMessage')}</BottomText>
    </>
  )
}

function InviteSentContent({
  address,
  addressHasChanged,
  recipient,
  e164PhoneNumber,
  amount,
}: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const totalAmount = amount
  const inviteFee = getInvitationVerificationFeeInDollars()
  // TODO: Use real fee
  const securityFee = new BigNumber(0)
  const totalFee = inviteFee.plus(securityFee)

  return (
    <>
      <UserSection
        type="sent"
        address={address}
        addressHasChanged={addressHasChanged}
        recipient={recipient}
        e164PhoneNumber={e164PhoneNumber}
        avatar={
          <ContactCircle
            name={recipient ? recipient.displayName : null}
            address={address}
            thumbnailPath={getRecipientThumbnail(recipient)}
          />
        }
      />
      <HorizontalLine />
      <FeeDrawer
        currency={CURRENCY_ENUM.DOLLAR}
        inviteFee={inviteFee}
        isInvite={true}
        securityFee={securityFee}
        totalFee={totalFee}
      />
      <TotalLineItem amount={totalAmount} hideSign={true} />
      <BottomText>{t('inviteFlow11:whySendFees')}</BottomText>
    </>
  )
}

function InviteReceivedContent({
  address,
  addressHasChanged,
  recipient,
  e164PhoneNumber,
  amount,
}: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const totalAmount = amount

  return (
    <>
      <UserSection
        type="received"
        address={address}
        addressHasChanged={addressHasChanged}
        recipient={recipient}
        e164PhoneNumber={e164PhoneNumber}
        avatar={
          <ContactCircle
            name={recipient ? recipient.displayName : null}
            address={address}
            thumbnailPath={getRecipientThumbnail(recipient)}
          />
        }
      />
      <HorizontalLine />
      <TotalLineItem amount={totalAmount} />
      <BottomText>{t('inviteFlow11:whyReceiveFees')}</BottomText>
    </>
  )
}

function NetworkFeeContent({ amount }: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const totalAmount = amount

  return (
    <>
      <TotalLineItem amount={totalAmount} hideSign={true} />
      <BottomText>
        {t('walletFlow5:networkFeeExplanation.0')}
        <Link onPress={onPressGoToFaq}>{t('walletFlow5:networkFeeExplanation.1')}</Link>
      </BottomText>
    </>
  )
}

function PaymentSentContent({
  address,
  addressHasChanged,
  recipient,
  e164PhoneNumber,
  amount,
  comment,
}: Props) {
  const { t } = useTranslation(Namespaces.sendFlow7)
  const sentAmount = amount
  // TODO: Use real fee
  const securityFee = new BigNumber(0)
  const totalAmount = amount
  const totalFee = securityFee

  const isCeloWithdrawal = amount.currencyCode === CURRENCIES[CURRENCY_ENUM.GOLD].code

  return (
    <>
      <UserSection
        type={isCeloWithdrawal ? 'withdrawn' : 'sent'}
        address={address}
        addressHasChanged={addressHasChanged}
        recipient={recipient}
        e164PhoneNumber={e164PhoneNumber}
        avatar={<TransferAvatars type="sent" address={address} recipient={recipient} />}
      />
      <CommentSection comment={comment} />
      <HorizontalLine />
      <LineItemRow
        title={t(isCeloWithdrawal ? 'amountCeloWithdrawn' : 'amountSent')}
        amount={<CurrencyDisplay amount={sentAmount} hideSign={true} />}
      />
      <FeeDrawer
        currency={isCeloWithdrawal ? CURRENCY_ENUM.GOLD : CURRENCY_ENUM.DOLLAR}
        securityFee={securityFee}
        totalFee={totalFee}
      />
      <TotalLineItem amount={totalAmount} hideSign={true} />
    </>
  )
}

function PaymentReceivedContent({ address, recipient, e164PhoneNumber, amount, comment }: Props) {
  const totalAmount = amount

  return (
    <>
      <UserSection
        type="received"
        address={address}
        recipient={recipient}
        e164PhoneNumber={e164PhoneNumber}
        avatar={<TransferAvatars type="received" address={address} recipient={recipient} />}
      />
      <CommentSection comment={comment} />
      <HorizontalLine />
      <TotalLineItem amount={totalAmount} />
    </>
  )
}

// Differs from TransferReviewCard which is used during Send flow, this is for completed txs
export default function TransferConfirmationCard(props: Props) {
  let content

  switch (props.type) {
    case TokenTransactionType.Faucet:
      content = <FaucetContent {...props} />
      break
    case TokenTransactionType.VerificationFee:
      content = <VerificationContent {...props} />
      break
    case TokenTransactionType.InviteSent:
      content = <InviteSentContent {...props} />
      break
    case TokenTransactionType.InviteReceived:
      content = <InviteReceivedContent {...props} />
      break
    case TokenTransactionType.NetworkFee:
      content = <NetworkFeeContent {...props} />
      break
    case TokenTransactionType.EscrowSent:
    case TokenTransactionType.Sent:
      content = <PaymentSentContent {...props} />
      break
    case TokenTransactionType.EscrowReceived:
    case TokenTransactionType.Received:
      content = <PaymentReceivedContent {...props} />
      break
  }

  return (
    <ScrollView contentContainerStyle={styles.contentContainer}>
      <SafeAreaView style={styles.content}>{content}</SafeAreaView>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  contentContainer: {
    flexGrow: 1,
  },
  content: {
    flexGrow: 1,
    padding: 16,
  },
})
