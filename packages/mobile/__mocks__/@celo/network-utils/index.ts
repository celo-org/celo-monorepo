export const GenesisBlockUtils = jest.fn()
GenesisBlockUtils.getGenesisBlockAsync = jest.fn()
GenesisBlockUtils.getChainIdFromGenesis = jest.fn()

export const StaticNodeUtils = jest.fn().mockImplementation()
StaticNodeUtils.getStaticNodesAsync = jest.fn()
StaticNodeUtils.getStaticNodeRegion = jest.fn()
StaticNodeUtils.getRegionalStaticNodesAsync = jest.fn()
StaticNodeUtils.getStaticNodesGoogleStorageBucketName = jest.fn()
