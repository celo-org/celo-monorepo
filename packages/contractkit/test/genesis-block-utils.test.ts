import { NETWORK_NAME } from '../contracts/network-name'
import GenesisBlockUtils from '../src/genesis-block-utils'
import { Logger, LogLevel } from '../src/logger'

describe('Genesis block utils', () => {
  describe('#getGenesisBlockAsync', () => {
    it('should be able to get Genesis block', async () => {
      Logger.setLogLevel(LogLevel.VERBOSE)
      const gensisBlock: string = await GenesisBlockUtils.getGenesisBlockAsync(NETWORK_NAME)
      Logger.debug('Genesis block utils', `Genesis block is ${gensisBlock}`)
      // Fail if genesis block is not proper JSON.
      await JSON.parse(gensisBlock)
      // Fail if genesis block is less than 100 characters.
      // An arbitrary limit which ensures that genesis block has some data.
      expect(gensisBlock.length).toBeGreaterThan(100)
    })

    it('should be able to get chain id from Genesis block', async () => {
      Logger.setLogLevel(LogLevel.VERBOSE)
      const genesisBlock: string = await GenesisBlockUtils.getGenesisBlockAsync(NETWORK_NAME)
      const chainId: number = GenesisBlockUtils.getChainIdFromGenesis(genesisBlock)
      Logger.debug('Genesis Block utils', `chainID is ${chainId}`)
      expect(chainId).toBeGreaterThan(0)
    })
  })
})
