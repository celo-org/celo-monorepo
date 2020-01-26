import BigNumber from 'bignumber.js'
import { EscrowedPayment } from 'src/escrow/actions'
import { SHORT_CURRENCIES } from 'src/geth/consts'
import { multiplyByWei } from 'src/utils/formatting'

const recipientPhone = '+491522345678'
const senderAddress = '0x000000000000000000000ce10'
const currency = SHORT_CURRENCIES.DOLLAR

const date = new BigNumber(
  new Date('Tue Mar 05 2019 13:44:06 GMT-0800 (Pacific Standard Time)').getTime()
)

export function escrowPaymentDouble(partial: object): EscrowedPayment {
  return {
    senderAddress,
    recipientPhone,
    paymentID: 'FAKE_ID_1',
    currency,
    amount: multiplyByWei(new BigNumber(7)),
    message: 'test message',
    timestamp: date,
    expirySeconds: new BigNumber(60),
    ...partial,
  }
}
