import BigNumber from 'bignumber.js'
import {
  convertDollarsToLocalAmount,
  convertDollarsToMaxSupportedPrecision,
  convertLocalAmountToDollars,
} from 'src/localCurrency/convert'
import { getMoneyDisplayValue } from 'src/utils/formatting'

describe(convertDollarsToMaxSupportedPrecision, () => {
  const EXCHANGE_RATE = 19.67

  it('should convert an amount entered in a local currency so it displays the same when converted back to the local currency', () => {
    const enteredLocalAmount = '2.99'
    const dollarsAmount = convertLocalAmountToDollars(enteredLocalAmount, EXCHANGE_RATE)
    const dollarsResult = convertDollarsToMaxSupportedPrecision(dollarsAmount!)
    const localAmountResult = convertDollarsToLocalAmount(dollarsResult, EXCHANGE_RATE)

    expect(getMoneyDisplayValue(localAmountResult!)).toEqual('2.99')
  })

  it('should not affect amounts which have less than 18 decimals (the max precision)', () => {
    const dollarsResult = convertDollarsToMaxSupportedPrecision(new BigNumber('2.99'))
    expect(dollarsResult.toString()).toEqual('2.99')
  })
})
