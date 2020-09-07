import BigNumber from 'bignumber.js'

export const toNum = (value: BigNumber.Value) => new BigNumber(value).toNumber()
export const toBool = (value: string | undefined, fallback: boolean) =>
  value ? value.toLowerCase() === 'true' : fallback
