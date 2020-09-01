import { GenesisBlockUtils } from './genesis-block-utils'

const NETWORK_NAME = 'alfajores'
const ENDPOINT = `https://www.googleapis.com/storage/v1/b/genesis_blocks/o/${NETWORK_NAME}?alt=media`

const mockGenesisBlock = {
  config: {
    homesteadBlock: 0,
    eip150Block: 0,
    eip150Hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
    eip155Block: 0,
    eip158Block: 0,
    byzantiumBlock: 0,
    constantinopleBlock: 0,
    petersburgBlock: 0,
    istanbulBlock: 0,
    chainId: 44787,
    istanbul: {
      policy: 2,
      blockperiod: 5,
      requesttimeout: 10000,
      epoch: 17280,
      lookbackwindow: 12,
    },
  },
  nonce: '0x0',
  timestamp: '0x5b843511',
  gasLimit: '0x8000000',
  extraData:
    '0xecc833a7747eaa8327335e8e0c6b6d8aa3a38d0063591e43ce116ccf5c89753ef905bbf8d294456f41406b32c45d59e539e4bba3d7898c3584da94dd1f519f63423045f526b8c83edc0eb4ba6434a494050f34537f5b2a00b9b9c752cb8500a3fce3da7d94cda518f6b5a797c3ec45d37c65b83e0b0748edca94b4e92c94a2712e98c020a81868264bde52c188cb94ae1ec841923811219b98aceb1db297aade2f46f394621843731fe33418007c06ee48cfd71e0ea828d9942a43f97f8bf959e31f69a894ebd80a88572c855394ad682035be6ab6f06e478d2bdab0eab6477b460e9430d060f129817c4de5fbc1366d53e19f43c8c64ff903d4b86011877b768127c8eb0f122fbe69553bc9d142d27c06a85c6eeb7b8b457f511e50c33a57fcbc5fd6d1823f69a111f8010151a17f6a8798a25343f5403b1e6a595c7d9698af3db78b013d26a761fc201b3cf793be5f0a0a849b3f68a8bfa81e7001b860d882cd4cc09109928e9517644d5303610155978cf5e3b7ad6122daa19c3dab3da8c439bc763d6d3eef18a38ebb0d3200664b94fab11adbb3f44b963969763b590af45931c482396be88a185214c9c8690615aae5197e852bc1d04b3dbd03ab80b86051588d46ba8998d944a30cde93bfe946e774ef1f6fe2fb559a74ffebf60d1ad967b876a038c6e312d0c20752cbc8440012293b6ea417f32a163caedeaaae7aad3c1b31be1fe86c405924b1be7d0aaae6f3ba567ee907d0d4c00dce5091442380b8601f2becc31c1f0141e8c5768c5f07d02d1342c086c037cce70aaf3629b40ea017884a81163f58697b020b21fe39c440006970bc1f52b847d7262599ae92ee7db45ad38efe5612c8ed42d9db9380da0769bab713f5259b7c015998296bf02a0a01b860d02ec615b916bba4fe7e65a3d79e607aa27bb5a84b0c2f242e9d8f379512cf40051a43030e55aca965d91c905b656d006434d95b7034bfc2e5e2ef7384e8cd640efae740558216f6f9db24c6d1acf755746dfbb68c76961593741105725d5680b860d6e86d5e73db3b3a2c96c6caa1a7e153e17adb13fb541943a44bfa90beab38aa73ad453d918fea2ba57c0a67115d0401c56946d8894f346d796864e9344fd1439dd1345de762f85d7e18e311b35c3cbe492886ef8bc872b4aabfa23c2e38a901b8601cf59939da60cdb9aff09f76e6070a17fa21356ca7016390ef4444243e12ab7ed7a233d7ca48b0d17870ba015a4410014e5cac8d456e03ec2908d347627d5e9ecd496ce990d10900ddc529300eef3d037e48d79f03ad2b6bcd48affe2ddf2681b8601cfe8876c0b89ef15128bb27eb69e7939b4a888b0a81195d5fd1bbda748a29838274e652dcf857f4090bb85343055300ca3e75a980b100403d3b6d34f62c6a86bbd75203391c63dd405725c69241a828e6892f623ed5b35c8dc132b032061201b860a6fc71d63c5adedb7b30b9e0ba3d83debf86d12ba235c13584a9cbad410f082030427be4f8a9127889979c3eea58860031af128deece487df5aef9d999c8dc2fb51f308eb1ee229e6bbd6860138d4fcf4209eb7bec62ca70dd8643104003c200b8606b7adb5d01e3fd72ae2c4ff17e6620dc383431e0ebe06c9af5b94207f380287429043e7bbe417b82d0aed2e43dc7b8002bb52886773e4a2c23bf0ebfd401471e8da3cf3a0a7e0949d9ad4de38138a787a975993ba311525ce8be331cd60d670080b8410000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000f86480b86000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080f86480b86000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000080',
  difficulty: '0x1',
  coinbase: '0x0000000000000000000000000000000000000000',
  alloc: {
    '456f41406B32c45D59E539e4BBA3D7898c3584dA': {
      balance: '103010030000000000000000000',
    },
    DD1F519F63423045F526b8c83edC0eB4BA6434a4: {
      balance: '10011000000000000000000',
    },
    '050f34537F5b2a00B9B9C752Cb8500a3fcE3DA7d': {
      balance: '10011000000000000000000',
    },
    Cda518F6b5a797C3EC45D37c65b83e0b0748eDca: {
      balance: '10011000000000000000000',
    },
    b4e92c94A2712e98c020A81868264bdE52C188Cb: {
      balance: '10011000000000000000000',
    },
    Ae1ec841923811219b98ACeB1db297AADE2F46F3: {
      balance: '10011000000000000000000',
    },
    '621843731fe33418007C06ee48CfD71e0ea828d9': {
      balance: '10011000000000000000000',
    },
    '2A43f97f8BF959E31F69A894ebD80A88572C8553': {
      balance: '10011000000000000000000',
    },
    AD682035bE6Ab6f06e478D2BDab0EAb6477B460E: {
      balance: '10011000000000000000000',
    },
    '30D060F129817c4DE5fBc1366d53e19f43c8c64f': {
      balance: '10011000000000000000000',
    },
    '22579CA45eE22E2E16dDF72D955D6cf4c767B0eF': {
      balance: '10011000000000000000000',
    },
    '1173C5A50bf025e8356823a068E396ccF2bE696C': {
      balance: '10011000000000000000000',
    },
    '40F71B525A96baa8d14Eaa7Bcd19929782659c64': {
      balance: '10011000000000000000000',
    },
    b923626C6f1d237252793FB2aA12BA21328C51BC: {
      balance: '10011000000000000000000',
    },
    B70f9ABf41F36B3ab60cc9aE1a85Ddda3C88D261: {
      balance: '10011000000000000000000',
    },
    d4369DB59eaDc4Cfa089c0a3c1004ceAb1b318D8: {
      balance: '10011000000000000000000',
    },
    '2fd430d3a96eadc38cc1B38b6685C5f52Cf7a083': {
      balance: '10011000000000000000000',
    },
    Fecc71C8f33Ca5952534fd346ADdeDC38DBb9cb7: {
      balance: '10011000000000000000000',
    },
    '0de78C89e7BF5060f28dd3f820C15C4A6A81AFB5': {
      balance: '10011000000000000000000',
    },
    '75411b92fcE120C1e7fd171b1c2bF802f2E3CF48': {
      balance: '10011000000000000000000',
    },
    '563433bD8357b06982Fe001df20B2b43393d21d2': {
      balance: '10011000000000000000000',
    },
    '79dfB9d2367E7921d4139D7841d24ED82F48907F': {
      balance: '10011000000000000000000',
    },
    '5809369FC5121a071eE67659a975e88ae40fBE3b': {
      balance: '10011000000000000000000',
    },
    '7517E54a456bcc6c5c695B5d9f97EBc05d29a824': {
      balance: '10011000000000000000000',
    },
    B0a1A5Ffcb34E6Fa278D2b40613f0AE1042d32f8: {
      balance: '10011000000000000000000',
    },
    EeE9f4DDf49976251E84182AbfD3300Ee58D12aa: {
      balance: '10011000000000000000000',
    },
    Eb5Fd57f87a4e1c7bAa53ec1c0d021bb1710B743: {
      balance: '10011000000000000000000',
    },
    B7Dd51bFb73c5753778e5Af56f1D9669BCe6777F: {
      balance: '10011000000000000000000',
    },
    '33C222BB13C63295AF32D6C91278AA34b573e776': {
      balance: '10011000000000000000000',
    },
    '83c58603bF72DA067D7f6238E7bF390d91B2f531': {
      balance: '10011000000000000000000',
    },
    '6651112198C0da05921355642a2B8dF1fA3Ede93': {
      balance: '10011000000000000000000',
    },
    '4EE72A98549eA7CF774C3E2E1b39fF166b4b68BE': {
      balance: '10011000000000000000000',
    },
    '840b32F30e1a3b2E8b9E6C0972eBa0148E22B847': {
      balance: '100000000000000000000',
    },
    '000000000000000000000000000000000000ce10': {
      code:
        '0x60806040526004361061004a5760003560e01c806303386ba3146101e757806342404e0714610280578063bb913f41146102d7578063d29d44ee14610328578063f7e6af8014610379575b6000600160405180807f656970313936372e70726f78792e696d706c656d656e746174696f6e00000000815250601c019050604051809103902060001c0360001b9050600081549050600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610136576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260158152602001807f4e6f20496d706c656d656e746174696f6e20736574000000000000000000000081525060200191505060405180910390fd5b61013f816103d0565b6101b1576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260188152602001807f496e76616c696420636f6e74726163742061646472657373000000000000000081525060200191505060405180910390fd5b60405136810160405236600082376000803683855af43d604051818101604052816000823e82600081146101e3578282f35b8282fd5b61027e600480360360408110156101fd57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291908035906020019064010000000081111561023a57600080fd5b82018360208201111561024c57600080fd5b8035906020019184600183028401116401000000008311171561026e57600080fd5b909192939192939050505061041b565b005b34801561028c57600080fd5b506102956105c1565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b3480156102e357600080fd5b50610326600480360360208110156102fa57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919050505061060d565b005b34801561033457600080fd5b506103776004803603602081101561034b57600080fd5b81019080803573ffffffffffffffffffffffffffffffffffffffff1690602001909291905050506107bd565b005b34801561038557600080fd5b5061038e610871565b604051808273ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200191505060405180910390f35b60008060007fc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a47060001b9050833f915080821415801561041257506000801b8214155b92505050919050565b610423610871565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146104c3576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260148152602001807f73656e64657220776173206e6f74206f776e657200000000000000000000000081525060200191505060405180910390fd5b6104cc8361060d565b600060608473ffffffffffffffffffffffffffffffffffffffff168484604051808383808284378083019250505092505050600060405180830381855af49150503d8060008114610539576040519150601f19603f3d011682016040523d82523d6000602084013e61053e565b606091505b508092508193505050816105ba576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252601e8152602001807f696e697469616c697a6174696f6e2063616c6c6261636b206661696c6564000081525060200191505060405180910390fd5b5050505050565b600080600160405180807f656970313936372e70726f78792e696d706c656d656e746174696f6e00000000815250601c019050604051809103902060001c0360001b9050805491505090565b610615610871565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff16146106b5576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260148152602001807f73656e64657220776173206e6f74206f776e657200000000000000000000000081525060200191505060405180910390fd5b6000600160405180807f656970313936372e70726f78792e696d706c656d656e746174696f6e00000000815250601c019050604051809103902060001c0360001b9050610701826103d0565b610773576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260188152602001807f496e76616c696420636f6e74726163742061646472657373000000000000000081525060200191505060405180910390fd5b8181558173ffffffffffffffffffffffffffffffffffffffff167fab64f92ab780ecbf4f3866f57cee465ff36c89450dcce20237ca7a8d81fb7d1360405160405180910390a25050565b6107c5610871565b73ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff1614610865576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260148152602001807f73656e64657220776173206e6f74206f776e657200000000000000000000000081525060200191505060405180910390fd5b61086e816108bd565b50565b600080600160405180807f656970313936372e70726f78792e61646d696e000000000000000000000000008152506013019050604051809103902060001c0360001b9050805491505090565b600073ffffffffffffffffffffffffffffffffffffffff168173ffffffffffffffffffffffffffffffffffffffff161415610960576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004018080602001828103825260118152602001807f6f776e65722063616e6e6f74206265203000000000000000000000000000000081525060200191505060405180910390fd5b6000600160405180807f656970313936372e70726f78792e61646d696e000000000000000000000000008152506013019050604051809103902060001c0360001b90508181558173ffffffffffffffffffffffffffffffffffffffff167f50146d0e3c60aa1d17a70635b05494f864e86144a2201275021014fbf08bafe260405160405180910390a2505056fea165627a7a723058202dbb6037e4381b4ad95015ed99441a23345cc2ae52ef27e2e91d34fb0acd277b0029',
      storage: {
        '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103':
          '456f41406B32c45D59E539e4BBA3D7898c3584dA',
      },
      balance: '0',
    },
  },
  number: '0x0',
  gasUsed: '0x0',
  mixHash: '0x63746963616c2062797a616e74696e65206661756c7420746f6c6572616e6365',
  parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
}

// TODO Create e2e test that actually performs network request to bucket
describe('Genesis block utils', () => {
  describe('#getGenesisBlockAsync', () => {
    afterEach(() => {
      fetchMock.reset()
    })

    it('should be able to get Genesis block', async () => {
      fetchMock.mock(ENDPOINT, mockGenesisBlock)
      const gensisBlock: string = await GenesisBlockUtils.getGenesisBlockAsync(NETWORK_NAME)
      // Fail if genesis block is not proper JSON.
      await JSON.parse(gensisBlock)
      // Fail if genesis block is less than 100 characters.
      // An arbitrary limit which ensures that genesis block has some data.
      expect(gensisBlock.length).toBeGreaterThan(100)
    })

    it('should be able to get chain id from Genesis block', async () => {
      fetchMock.mock(ENDPOINT, mockGenesisBlock)
      const genesisBlock: string = await GenesisBlockUtils.getGenesisBlockAsync(NETWORK_NAME)
      const chainId: number = GenesisBlockUtils.getChainIdFromGenesis(genesisBlock)
      expect(chainId).toBeGreaterThan(0)
    })
  })
})
