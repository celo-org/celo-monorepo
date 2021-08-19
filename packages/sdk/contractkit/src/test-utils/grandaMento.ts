import BigNumber from 'bignumber.js'
import { GrandaMentoWrapper } from '../wrappers/GrandaMento'

export const increaseLimits = async (
  grandaMento: GrandaMentoWrapper,
  newLimitMin: BigNumber = new BigNumber('1000'),
  newLimitMax: BigNumber = new BigNumber('1000000000000')
) => {
  await (
    await grandaMento.setStableTokenExchangeLimits(
      'StableToken',
      newLimitMin.toString(),
      newLimitMax.toString()
    )
  ).sendAndWaitForReceipt()
}
