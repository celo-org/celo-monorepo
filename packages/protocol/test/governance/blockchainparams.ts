import { BlockchainParamsContract, BlockchainParamsInstance } from 'types'

const BlockchainParamsTest: BlockchainParamsContract = artifacts.require('BlockchainParams')

contract('BlockchainParams', () => {
  let blockchainParamsTest: BlockchainParamsInstance
  const version = '1.8.4'

  beforeEach(async () => {
    blockchainParamsTest = await BlockchainParamsTest.new()
  })

  describe('#setMinimumClientVersion()', () => {
    it('should set the variable', async () => {
      await blockchainParamsTest.setMinimumClientVersion(version)
      assert.equal(version, await blockchainParamsTest.minimumClientVersion())
    })
  })
})
