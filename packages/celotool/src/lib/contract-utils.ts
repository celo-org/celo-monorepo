import { GoldTokenWrapper } from '@celo/contractkit/lib/wrappers/GoldTokenWrapper'
import { StableTokenWrapper } from '@celo/contractkit/lib/wrappers/StableTokenWrapper'
import { BigNumber } from 'bignumber.js'

export async function convertToContractDecimals(
  value: number | BigNumber,
  contract: StableTokenWrapper | GoldTokenWrapper
) {
  const decimals = new BigNumber(await contract.decimals())
  const one = new BigNumber(10).pow(decimals.toNumber())
  return one.times(value)
}
