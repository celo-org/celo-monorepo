import { BootnodeUtils } from './bootnode-utils'

const NETWORK_NAME = 'alfajores'

describe(BootnodeUtils, () => {
  describe(BootnodeUtils.getBootnodesAsync, () => {
    it('should be able to get static nodes', async () => {
      const nodes = await BootnodeUtils.getBootnodesAsync(NETWORK_NAME)
      // Fail if genesis block is not proper JSON.
      const nodesJson = await nodes.split(';')
      // Fail if genesis block is less than 100 characters.
      // An arbitrary limit which ensures that genesis block has some data.
      expect(nodes.length).toBeGreaterThan(100)
      // Expect at least one node
      expect(nodesJson.length).toBeGreaterThan(0)
    })
  })
})
