import BigNumber from 'bignumber.js'

export function convertDollarsToLocalAmount(
  amount: BigNumber.Value | null,
  exchangeRate: number | null | undefined
) {
  if (!amount || !exchangeRate) {
    return null
  }

  return new BigNumber(amount).multipliedBy(exchangeRate)
}

export function convertLocalAmountToDollars(
  amount: BigNumber.Value | null,
  exchangeRate: number | null | undefined
) {
  if (!amount || !exchangeRate) {
    return null
  }

  return new BigNumber(amount).dividedBy(exchangeRate)
}

// This is needed to have the maximum supported precision
// when the initial amount was entered in the local currency.
// Otherwise the confirmation screen won't display the same
// local currency amount that was entered, or the fee/send
// will fail because of a decimal part remaining.
//
// Let's take an example.
// - User enters `2` MXN (their local currency)
// - User expects `2` MXN to be displayed in the confirmation screen
// - Technically the confirmation screens receives `2 / exchangeRate`,
//   if we take `19.67` as the exchange rate, the dollar amount is then
//   `0.10167768174885612608`. Given we want to display the local amount
//   in the confirmation too, we need to convert again,
//   `0.10167768174885612608 * 19.67 = 1.9999999999999999999936`
//   which displays as `1.99 MXN` (which is not what the user expects)
//   and also yields the following fee calculation error:
//   `CalculateFee/Error calculating fee:invalid number value
//   (arg="value", coderType="uint256", value="101677681748856126.08")`
//   as `0.10167768174885612608` is converted to wei but still has a
//   decimal part which is not accepted by the contract.
// - That's why we limit the precision to 18 decimals (number of 0 in WEI_PER_CELO)
//   and round up at this precision!
// - This really only affects amounts entered in a local currency.
//   If the user enters `2.99` cUSD, this function has no impact
//   and `2.99` is still displayed in the confirmation screen.
export function convertDollarsToMaxSupportedPrecision(amount: BigNumber) {
  return new BigNumber(amount.toPrecision(18, BigNumber.ROUND_UP))
}
