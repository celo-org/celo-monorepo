export const TEST_DOLLAR_ADDRESS = '0x0000000000000000000000000000000000dollaR'
export const TEST_GOLD_ADDRESS = '0x000000000000000000000000000000000000golD' // Note upper and lower case letters

const mockTokenTxs = {
  data: {
    transferTxs: {
      edges: [
        // Exchange cUSD -> cGLD
        /*{
          node: {
            blockNumber: 192943,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x6a61e1e693c765cbab7e02a500665f2e13ee46df',
                    toAddressHash: '0x0000000000000000000000000000000000007E57',
                    token: 'cGLD',
                    value: '10000000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xf1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc',
                    token: 'cUSD',
                    value: '10000000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0xf1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc',
                    toAddressHash: '0x0000000000000000000000000000000000000000',
                    token: 'cUSD',
                    value: '10000000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '1991590000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xdd1f519f63423045f526b8c83edc0eb4ba6434a4',
                    token: 'cUSD',
                    value: '7966360000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xf9720b2ff2cf69f8a50dc5bec5545ba883e0ae3f',
                    token: 'cUSD',
                    value: '0',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '199159',
            gatewayFee: '0',
            gatewayFeeRecipient: '0xf9720b2ff2cf69f8a50dc5bec5545ba883e0ae3f',
            timestamp: '2020-04-21T10:09:24.000000Z',
            transactionHash: '0xba620de2d812f299d987155eb5dca7abcfeaf154f5cfd99cb1773452a7df3d7a',
          },
        },*/
        // Exchange cGLD -> cUSD
        /*{
      value: '10000000000000000000',
      transactionIndex: '0',
      tokenSymbol: 'cGLD',
      tokenName: 'Celo Gold',
      tokenDecimal: '18',
      to: '0xe167029b1a56c6cba74c35c472e9db3c9e2402ff',
      timeStamp: '1566345866',
      nonce: '223',
      input:
        '0xa9059cbb000000000000000000000000e167029b1a56c6cba74c35c472e9db3c9e2402ff0000000000000000000000000000000000000000000000008ac7230489e80000',
      hash: '0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2',
      gasUsed: '67154',
      gasPrice: '100000000000',
      gas: '6700000',
      from: '0x0000000000000000000000000000000000007E57',
      cumulativeGasUsed: '67154',
      contractAddress: TEST_GOLD_ADDRESS,
      confirmations: '269650',
      blockNumber: '90637',
      blockHash: '0x9ca0ae7f9496660c849069e05f8f429048bc185d7578f6315f07c0e68ad0b330',
    },
    // Exchange incoming
    {
      value: '10000000000000000000',
      transactionIndex: '0',
      tokenSymbol: 'cUSD',
      tokenName: 'Celo Dollar',
      tokenDecimal: '18',
      to: '0x0000000000000000000000000000000000007E57',
      timeStamp: '1566345876',
      nonce: '224',
      input:
        '0xa9059cbb000000000000000000000000e167029b1a56c6cba74c35c472e9db3c9e2402ff0000000000000000000000000000000000000000000000008ac7230489e80000',
      hash: '0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2',
      gasUsed: '55740',
      gasPrice: '100000000000',
      gas: '6700000',
      from: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
      cumulativeGasUsed: '55740',
      contractAddress: TEST_DOLLAR_ADDRESS,
      confirmations: '269648',
      blockNumber: '90639',
      blockHash: '0x6cec0caf59b0441812cb6a7eb7eeadae1721bf5cc3beeaa993e2bfd8a570bb22',
    },*/
        {
          node: {
            blockNumber: 90637,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x6a61e1e693c765cbab7e02a500665f2e13ee46df',
                    token: 'cGLD',
                    value: '10000000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000000000',
                    toAddressHash: '0x0000000000000000000000000000000000007E57',
                    token: 'cUSD',
                    value: '10000000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '2175980000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x30d060f129817c4de5fbc1366d53e19f43c8c64f',
                    token: 'cUSD',
                    value: '8703920000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xfcf7fc2f0c1f06fb6314f9fa2a53e9805aa863e0',
                    token: 'cUSD',
                    value: '0',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '217598',
            gatewayFee: '0',
            gatewayFeeRecipient: '0xfcf7fc2f0c1f06fb6314f9fa2a53e9805aa863e0',
            timestamp: '2019-08-21T00:04:26.000000Z',
            transactionHash: '0x961403536006f9c120c23900f94da59dbf43edf10eb3569b448665483bab77b2',
          },
        },
        // Dollars sent
        /*{
      value: '150000000000000000',
      transactionIndex: '1',
      tokenSymbol: 'cUSD',
      tokenName: 'Celo Dollar',
      tokenDecimal: '18',
      to: '0x8b7649116f169d2d2aebb6ea1a77f0baf31f2811',
      timeStamp: '1566346276',
      nonce: '1',
      input:
        '0xd02e0f0c681ea8bf469fe300315d8caf1f9c22002c1f516a8b329cfcc9288e3518104f4300000000000000000000000000000000000000000000000000000000000000030000000000000000000000002df4dd6bd1b26a8503f763506bdb8e7cf165f69e',
      hash: '0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2fb',
      gasUsed: '1604760',
      gasPrice: '200',
      gas: '7000000',
      from: '0x0000000000000000000000000000000000007E57',
      cumulativeGasUsed: '1788432',
      contractAddress: TEST_DOLLAR_ADDRESS,
      confirmations: '269568',
      blockNumber: '90719',
      blockHash: '0x9418a662ed1f4a33297500a2a14af01c6bbd7aeb88eb80324d7fbd7d41a9236f',
    }, */

        {
          node: {
            blockNumber: 90719,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x8b7649116f169d2d2aebb6ea1a77f0baf31f2811',
                    token: 'cUSD',
                    value: '150000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '1131780000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x050f34537f5b2a00b9b9c752cb8500a3fce3da7d',
                    token: 'cUSD',
                    value: '4527120000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
                    token: 'cUSD',
                    value: '0',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '113178',
            gatewayFee: '0',
            gatewayFeeRecipient: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
            timestamp: '2019-08-21T00:11:16.000000Z',
            transactionHash: '0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2fb',
          },
        },
        // Dollars received
        /* {
      value: '10000000000000000000',
      transactionIndex: '0',
      tokenSymbol: 'cUSD',
      tokenName: 'Celo Dollar',
      tokenDecimal: '18',
      to: '0x0000000000000000000000000000000000007E57',
      timeStamp: '1566479946',
      nonce: '234',
      input:
        '0xa9059cbb000000000000000000000000e167029b1a56c6cba74c35c472e9db3c9e2402ff0000000000000000000000000000000000000000000000008ac7230489e80000',
      hash: '0xe70bf600802bae7a0d42d89d54b8cdb977a8c5a34a239ec73597c7abcab74536',
      gasUsed: '40740',
      gasPrice: '100000000000',
      gas: '6700000',
      from: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
      cumulativeGasUsed: '40740',
      contractAddress: TEST_DOLLAR_ADDRESS,
      confirmations: '242834',
      blockNumber: '117453',
      blockHash: '0x995bfb34d28ead83fed889bc46fc18ec3e82bb7172ef5d5bf78a5086fd715e41',
    },*/
        {
          node: {
            blockNumber: 117453,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAddressHash: '0x0000000000000000000000000000000000007E57',
                    token: 'cUSD',
                    value: '10000000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '1297230000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAddressHash: '0x2a43f97f8bf959e31f69a894ebd80a88572c8553',
                    token: 'cUSD',
                    value: '5188920000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAddressHash: '0xfcf7fc2f0c1f06fb6314f9fa2a53e9805aa863e0',
                    token: 'cUSD',
                    value: '0',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '129723',
            gatewayFee: '0',
            gatewayFeeRecipient: '0xfcf7fc2f0c1f06fb6314f9fa2a53e9805aa863e0',
            timestamp: '2019-08-22T13:19:06.000000Z',
            transactionHash: '0xe70bf600802bae7a0d42d89d54b8cdb977a8c5a34a239ec73597c7abcab74536',
          },
        },
        // Gold sent
        /*{
      value: '1000000000000000000',
      transactionIndex: '0',
      tokenSymbol: 'cGLD',
      tokenName: 'Celo Gold',
      tokenDecimal: '18',
      to: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
      timeStamp: '1566481000',
      nonce: '233',
      input:
        '0xa9059cbb000000000000000000000000e167029b1a56c6cba74c35c472e9db3c9e2402ff0000000000000000000000000000000000000000000000008ac7230489e80000',
      hash: '0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435be',
      gasUsed: '67154',
      gasPrice: '100000000000',
      gas: '6700000',
      from: '0x0000000000000000000000000000000000007E57',
      cumulativeGasUsed: '67154',
      contractAddress: TEST_GOLD_ADDRESS,
      confirmations: '242836',
      blockNumber: '117451',
      blockHash: '0xcfffc293e190c74490b6c5a3ea831e7020c4380d7a5330716b9eb6e0db1df95d',
    },*/
        {
          node: {
            blockNumber: 117451,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    token: 'cGLD',
                    value: '1000000000000000000',
                  },
                },
              ],
            },
            feeCurrency: null,
            feeToken: 'cGLD',
            gasPrice: '5000000000',
            gasUsed: '47426',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            timestamp: '2019-08-22T13:36:40.000000Z',
            transactionHash: '0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435be',
          },
        },
        // Gold received
        /*{
  value: '10000000000000000000',
  transactionIndex: '0',
  tokenSymbol: 'cGLD',
  tokenName: 'Celo Gold',
  tokenDecimal: '18',
  to: '0x0000000000000000000000000000000000007E57',
  timeStamp: '1566482000',
  nonce: '234',
  input:
    '0xa9059cbb000000000000000000000000e167029b1a56c6cba74c35c472e9db3c9e2402ff0000000000000000000000000000000000000000000000008ac7230489e80000',
  hash: '0xe8fe81f455eb34b672a8d8dd091472f1ae8d4d204817f0bcbb7a13486b9b5605',
  gasUsed: '67154',
  gasPrice: '100000000000',
  gas: '6700000',
  from: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
  cumulativeGasUsed: '67154',
  contractAddress: TEST_GOLD_ADDRESS,
  confirmations: '242836',
  blockNumber: '117451',
  blockHash: '0xcfffc293e190c74490b6c5a3ea831e7020c4380d7a5330716b9eb6e0db1df95d',
},*/
        {
          node: {
            blockNumber: 117451,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAddressHash: '0x0000000000000000000000000000000000007E57',
                    token: 'cGLD',
                    value: '10000000000000000000',
                  },
                },
              ],
            },
            feeCurrency: null,
            feeToken: 'cGLD',
            gasPrice: '5000000000',
            gasUsed: '47426',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            timestamp: '2019-08-22T13:53:20.000000Z',
            transactionHash: '0xe8fe81f455eb34b672a8d8dd091472f1ae8d4d204817f0bcbb7a13486b9b5605',
          },
        },
        // Faucet received
        /*{
  value: '5000000000000000000',
  transactionIndex: '0',
  tokenSymbol: 'cGLD',
  tokenName: 'Celo Gold',
  tokenDecimal: '18',
  to: '0x0000000000000000000000000000000000007E57',
  timeStamp: '1566483000',
  nonce: '233',
  input:
    '0xa9059cbb000000000000000000000000e167029b1a56c6cba74c35c472e9db3c9e2402ff0000000000000000000000000000000000000000000000008ac7230489e80000',
  hash: '0xf6856169eb7bf78211babc312028cddf3dad2761799428ab6e4fcf297a27fe09',
  gasUsed: '67154',
  gasPrice: '100000000000',
  gas: '6700000',
  from: '0x0000000000000000000000000000000000f40c37',
  cumulativeGasUsed: '67154',
  contractAddress: TEST_GOLD_ADDRESS,
  confirmations: '242836',
  blockNumber: '117451',
  blockHash: '0xcfffc293e190c74490b6c5a3ea831e7020c4380d7a5330716b9eb6e0db1df95d',
},*/
        {
          node: {
            blockNumber: 117451,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000f40c37',
                    toAddressHash: '0x0000000000000000000000000000000000007E57',
                    token: 'cGLD',
                    value: '5000000000000000000',
                  },
                },
              ],
            },
            feeCurrency: null,
            feeToken: 'cGLD',
            gasPrice: '5000000000',
            gasUsed: '47426',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            timestamp: '2019-08-22T14:10:00.000000Z',
            transactionHash: '0xf6856169eb7bf78211babc312028cddf3dad2761799428ab6e4fcf297a27fe09',
          },
        },
        // Verification fee sent
        /*{
          value: '200000000000000000',
          transactionIndex: '0',
          tokenSymbol: 'cUSD',
          tokenName: 'Celo Dollar',
          tokenDecimal: '18',
          to: '0x0000000000000000000000000000000000a77357',
          timeStamp: '1566484000',
          nonce: '233',
          input:
            '0xa9059cbb000000000000000000000000e167029b1a56c6cba74c35c472e9db3c9e2402ff0000000000000000000000000000000000000000000000008ac7230489e80000',
          hash: '0xcc2120e5d050fd68284dc01f6464b2ed8f7358ca80fccb20967af28eb7d79160',
          gasUsed: '67154',
          gasPrice: '100000000000',
          gas: '6700000',
          from: '0x0000000000000000000000000000000000007E57',
          cumulativeGasUsed: '67154',
          contractAddress: TEST_DOLLAR_ADDRESS,
          confirmations: '242836',
          blockNumber: '117451',
          blockHash: '0xcfffc293e190c74490b6c5a3ea831e7020c4380d7a5330716b9eb6e0db1df95d',
        }*/ {
          node: {
            blockNumber: 117451,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x0000000000000000000000000000000000a77357',
                    token: 'cUSD',
                    value: '200000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '1590510000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xae1ec841923811219b98aceb1db297aade2f46f3',
                    token: 'cUSD',
                    value: '6362040000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
                    token: 'cUSD',
                    value: '0',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '159051',
            gatewayFee: '0',
            gatewayFeeRecipient: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
            timestamp: '2019-08-22T14:26:40.000000Z',
            transactionHash: '0xcc2120e5d050fd68284dc01f6464b2ed8f7358ca80fccb20967af28eb7d79160',
          },
        },
        // Contract call with no true token transfers (just fees)
        {
          node: {
            blockNumber: 192467,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '990330000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x456f41406b32c45d59e539e4bba3d7898c3584da',
                    token: 'cUSD',
                    value: '3961320000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
                    token: 'cUSD',
                    value: '0',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '99033',
            gatewayFee: '0',
            gatewayFeeRecipient: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
            timestamp: '2020-04-21T09:29:44.000000Z',
            transactionHash: '0xfa658a2be84e9ef0ead58ea2d8e2d3c9160bf0769451b5dc971c2d82c9c33c42',
          },
        },
      ],
    },
  },
}
export default mockTokenTxs
