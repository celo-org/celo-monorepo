import { DAILY_PAYMENT_LIMIT_CUSD } from 'src/config'
import { PaymentInfo } from 'src/send/reducers'
import { timeDeltaInHours } from 'src/utils/time'

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
