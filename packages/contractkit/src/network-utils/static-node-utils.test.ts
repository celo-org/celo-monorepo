import { StaticNodeUtils } from './static-node-utils'

const NETWORK_NAME = 'alfajores'

describe(StaticNodeUtils, () => {
  describe(StaticNodeUtils.getStaticNodesAsync, () => {
    it('should be able to get static nodes', async () => {
      const nodes = await StaticNodeUtils.getStaticNodesAsync(NETWORK_NAME)
      // Fail if genesis block is not proper JSON.
      const nodesJson = await JSON.parse(nodes)
      // Fail if genesis block is less than 100 characters.
      // An arbitrary limit which ensures that genesis block has some data.
      expect(nodes.length).toBeGreaterThan(100)
      // Expect at least two nodes
      expect(nodesJson.length).toBeGreaterThan(1)
    })
  })
})
