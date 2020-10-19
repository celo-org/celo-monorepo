import BigNumber from 'bignumber.js'

const WEI_PER_UNIT = 1000000000000000000

// A small amount returns a rate closer to the median rate
export const DOLLAR_AMOUNT_FOR_ESTIMATE = new BigNumber(0.01 * WEI_PER_UNIT) // 0.01 dollar
export const CELO_AMOUNT_FOR_ESTIMATE = new BigNumber(0.01 * WEI_PER_UNIT) // 0.01 celo
