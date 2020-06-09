import BigNumber from 'bignumber.js'
import { TokenTransactionType } from 'src/apollo/types'
import { DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { FeeType } from 'src/fees/actions'
import { getAddressFromPhoneNumber } from 'src/identity/contactMapping'
import { E164NumberToAddressType, SecureSendPhoneNumberMapping } from 'src/identity/reducer'
import { RecipientVerificationStatus } from 'src/identity/types'
import { Recipient, RecipientKind } from 'src/recipients/recipient'
import { PaymentInfo } from 'src/send/reducers'
import { TransactionDataInput } from 'src/send/SendAmount'
import { timeDeltaInHours } from 'src/utils/time'

export interface ConfirmationInput {
  recipient: Recipient
  amount: BigNumber
  reason?: string
  recipientAddress: string | null | undefined
  type: TokenTransactionType
  firebasePendingRequestUid?: string | null
}

export const getConfirmationInput = (
  transactionData: TransactionDataInput,
  e164NumberToAddress: E164NumberToAddressType,
  secureSendPhoneNumberMapping: SecureSendPhoneNumberMapping
): ConfirmationInput => {
  const { recipient } = transactionData
  let recipientAddress: string | null | undefined

  if (recipient.kind === RecipientKind.QrCode || recipient.kind === RecipientKind.Address) {
    recipientAddress = recipient.address
  } else if (recipient.e164PhoneNumber) {
    recipientAddress = getAddressFromPhoneNumber(
      recipient.e164PhoneNumber,
      e164NumberToAddress,
      secureSendPhoneNumberMapping
    )
  }

  return { ...transactionData, recipientAddress }
}

export const getFeeType = (
  recipientVerificationStatus: RecipientVerificationStatus
): FeeType | null => {
  switch (recipientVerificationStatus) {
    case RecipientVerificationStatus.UNKNOWN:
      return null
    case RecipientVerificationStatus.UNVERIFIED:
      return FeeType.INVITE
    case RecipientVerificationStatus.VERIFIED:
      return FeeType.SEND
  }
}

export function isPaymentLimitReached(
  now: number,
  recentPayments: PaymentInfo[],
  initial: number
): boolean {
  const amount = dailySpent(now, recentPayments) + initial
  return amount > DAILY_PAYMENT_LIMIT_CUSD
}

export function dailyAmountRemaining(now: number, recentPayments: PaymentInfo[]) {
  return DAILY_PAYMENT_LIMIT_CUSD - dailySpent(now, recentPayments)
}

function dailySpent(now: number, recentPayments: PaymentInfo[]) {
  // we are only interested in the last 24 hours
  const paymentsLast24Hours = recentPayments.filter(
    (p: PaymentInfo) => timeDeltaInHours(now, p.timestamp) < 24
  )

  const amount: number = paymentsLast24Hours.reduce((sum, p: PaymentInfo) => sum + p.amount, 0)
  return amount
}
