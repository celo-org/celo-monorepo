import { GenesisBlockUtils } from './genesis-block-utils'

const NETWORK_NAME = 'alfajores'

describe('Genesis block utils', () => {
  describe('#getGenesisBlockAsync', () => {
    it('should be able to get Genesis block', async () => {
      const gensisBlock: string = await GenesisBlockUtils.getGenesisBlockAsync(NETWORK_NAME)
      // Fail if genesis block is not proper JSON.
      await JSON.parse(gensisBlock)
      // Fail if genesis block is less than 100 characters.
      // An arbitrary limit which ensures that genesis block has some data.
      expect(gensisBlock.length).toBeGreaterThan(100)
    })

    it('should be able to get chain id from Genesis block', async () => {
      const genesisBlock: string = await GenesisBlockUtils.getGenesisBlockAsync(NETWORK_NAME)
      const chainId: number = GenesisBlockUtils.getChainIdFromGenesis(genesisBlock)
      expect(chainId).toBeGreaterThan(0)
    })
  })
})
