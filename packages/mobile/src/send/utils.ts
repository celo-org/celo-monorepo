import { DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { PaymentInfo } from 'src/send/reducers'
import { timeDeltaInHours } from 'src/utils/time'

export function isPaymentLimitReached(
  now: number,
  recentPayments: PaymentInfo[],
  initial: number
): boolean {
  // we are only interested in the last 24 hours
  const paymentsLast24Hours = recentPayments.filter(
    (p: PaymentInfo) => timeDeltaInHours(now, p.timestamp) < 24
  )

  const amount: number = paymentsLast24Hours.reduce(
    (sum, p: PaymentInfo) => sum + p.amount,
    initial
  )

  return amount > DAILY_PAYMENT_LIMIT_CUSD
}
