import { getGoldTokenAddress } from '../src/erc20-utils'
import { Logger, LogLevel } from '../src/logger'
import { getWeb3ForTesting } from './utils'

beforeAll(() => {
  Logger.setLogLevel(LogLevel.VERBOSE)
})

describe('Gold token', () => {
  describe('#getGoldTokenAddress', () => {
    it(
      'is able to fetch the address',
      async () => {
        const web3 = await getWeb3ForTesting()
        const address: string = await getGoldTokenAddress(web3)
        Logger.debug('GetGoldTokenAddress Test', `Gold token address is ${address}`)
        expect(address).not.toBe('0')
      },
      0
    )
  })
})
