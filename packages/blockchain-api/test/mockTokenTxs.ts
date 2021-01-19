export const TEST_DOLLAR_ADDRESS = '0x0000000000000000000000000000000000dollaR'
export const TEST_GOLD_ADDRESS = '0x000000000000000000000000000000000000golD' // Note upper and lower case letters

const mockTokenTxs = {
  data: {
    transferTxs: {
      edges: [
        // Exchange cUSD -> cGLD (TX 1)
        {
          node: {
            blockNumber: 90608,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x6a61e1e693c765cbab7e02a500665f2e13ee46df',
                    toAddressHash: '0x0000000000000000000000000000000000007E57',
                    token: 'cGLD',
                    value: '1000000000000000000',
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
            timestamp: '2019-08-21T00:03:17.000000Z',
            transactionHash: '0xba620de2d812f299d987155eb5dca7abcfeaf154f5cfd99cb1773452a7df3d7a',
          },
        },
        // Exchange cUSD -> cGLD (TX 2)
        {
          node: {
            blockNumber: 90608,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '26801514493125',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x2eb79345089ca6f703f3b3c4235315cbeaad6d3c',
                    token: 'cUSD',
                    value: '107206057972500',
                  },
                },
              ],
            },
            feeToken: 'cUSD',
            gasPrice: '1374648125',
            gasUsed: '97485',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            input:
              '0x095ea7b3000000000000000000000000f1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc0000000000000000000000000000000000000000000000008ac7230489e80000',
            timestamp: '2019-08-21T00:03:16.000000Z',
            transactionHash: '0xa9569567c48c547cc3712d8caa113d7d276092ee8bcf93416ac4622745a7ae52',
          },
        },
        // Exchange cGLD -> cUSD (TX1)
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
                    value: '1000000000000000000',
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
        // Exchange cGLD -> cUSD (TX2)
        {
          node: {
            blockNumber: 90637,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '29106906186364',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xaed733bb20921b682eb35bb89bd398f604ccd5bc',
                    token: 'cUSD',
                    value: '116427624745456',
                  },
                },
              ],
            },
            feeToken: 'cUSD',
            gasPrice: '1516332190',
            gasUsed: '95978',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            input:
              '0x095ea7b3000000000000000000000000f1235cb0d3703e7cc2473fb4e214fbc7a9ff77cc0000000000000000000000000000000000000000000000000de0B6b3a7640000',
            timestamp: '2019-08-21T00:04:26.000000Z',
            transactionHash: '0x376bf768df3132b789057030b8a0fdfc286a086d9d62a0ad271838fd2266d28c',
          },
        },
        // Dollars sent
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
                    value: '10000000000000000',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '113178',
            gatewayFee: '10000000000000000',
            gatewayFeeRecipient: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
            timestamp: '2019-08-21T00:11:16.000000Z',
            transactionHash: '0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2fb',
          },
        },
        // Dollars sent to the governance contract (edge case)
        {
          node: {
            blockNumber: 90791,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
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
                    value: '10000000000000000',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '113178',
            gatewayFee: '10000000000000000',
            gatewayFeeRecipient: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
            timestamp: '2019-08-21T00:11:16.000000Z',
            transactionHash: '0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326a2ff',
          },
        },
        // Dollars sent to the gateway fee recipient (edge case)
        {
          node: {
            blockNumber: 90792,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
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
                    value: '10000000000000000',
                  },
                },
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '113178',
            gatewayFee: '10000000000000000',
            gatewayFeeRecipient: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
            timestamp: '2019-08-21T00:11:16.000000Z',
            transactionHash: '0x21dd2c18ae6c80d61ffbddaa073f7cde7bbfe9436fdf5059b506f1686326afff',
          },
        },
        // Dollars received
        {
          node: {
            blockNumber: 117453,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    fromAccountHash: '0xf4314cb9046bece6aa54bb9533155434d0c76910', // this should go to the `account` field
                    toAddressHash: '0x0000000000000000000000000000000000007E57',
                    token: 'cUSD',
                    value: '10000000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    toAccountHash: null,
                    token: 'cUSD',
                    value: '1297230000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAddressHash: '0x2a43f97f8bf959e31f69a894ebd80a88572c8553',
                    toAccountHash: null,
                    token: 'cUSD',
                    value: '5188920000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAddressHash: '0xfcf7fc2f0c1f06fb6314f9fa2a53e9805aa863e0',
                    toAccountHash: null,
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
        {
          node: {
            blockNumber: 117451,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xf4314cb9046bece6aa54bb9533155434d0c76909',
                    toAccountHash: '0xf4314cb9046bece6aa54bb9533155434d0c76910', // this should go to the `account` field
                    token: 'cGLD',
                    value: '1000000000000000000',
                  },
                },
              ],
            },
            feeCurrency: null,
            feeToken: '', // empty feeToken should be treated as cGLD
            gasPrice: '5000000000',
            gasUsed: '47426',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            timestamp: '2019-08-22T13:36:40.000000Z',
            transactionHash: '0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435be',
          },
        },
        // Gold sent (with gateway fee)
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
            feeToken: null, // empty feeToken should be treated as cGLD
            gasPrice: '5000000000',
            gasUsed: '47426',
            gatewayFee: '10000000000',
            gatewayFeeRecipient: '0x6a0edf42f5e618bee697e7718fa05efb1ea5d11c',
            timestamp: '2019-08-22T13:36:40.000000Z',
            transactionHash: '0xc6689ed516e8b114e875d682bbf7ba318ea16841711d97ce473f20da289435bd',
          },
        },
        // Gold received
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
        // Escrow sent (TX 1)
        {
          node: {
            blockNumber: 117451,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x0000000000000000000000000000000000a77327',
                    token: 'cUSD',
                    value: '118829058457955309',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '91454741122586',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x2765162cc4ad257a956f0411675bc45257e6cb30',
                    token: 'cUSD',
                    value: '365818964490344',
                  },
                },
              ],
            },
            feeToken: 'cUSD',
            gasPrice: '1373511910',
            gasUsed: '332923',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            input:
              '0x702cb75d155a1584225c4795ce22348f806b053711a7744971bb9186f72b8df66230d8c0000000000000000000000000765de816845861e75a25fca122bb6898b8b1282a00000000000000000000000000000000000000000000000001a62a662a616bed00000000000000000000000000000000000000000000000000000000000151800000000000000000000000007e86109bbac0b29d408dfa003e45ec92e1e677cf0000000000000000000000000000000000000000000000000000000000000003',
            timestamp: '2019-08-22T14:26:38.000000Z',
            transactionHash: '0xf0592e026656f84cc17672fb08f5723deb8426787c2865aa763e859d10e85234',
          },
        },
        // Escrow sent (TX 2)
        {
          node: {
            blockNumber: 117451,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '26782658137854',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x90684bc3ded2f69d8853d791bdc57eea0a84c9d0',
                    token: 'cUSD',
                    value: '107130632551416',
                  },
                },
              ],
            },
            feeToken: 'cUSD',
            gasPrice: '1373511910',
            gasUsed: '97497',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            input:
              '0x095ea7b30000000000000000000000000000000000000000000000000000000000a7732700000000000000000000000000000000000000000000000001a62a662a616bed',
            timestamp: '2019-08-22T14:26:39.000000Z',
            transactionHash: '0xfe39014b70746259a1dc4cc99c67acbb986d68f32cdb42e68a2678082a1695dc',
          },
        },
        // Verification fee sent (no gateway fee recipient)
        {
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
              ],
            },
            feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
            feeToken: 'cUSD',
            gasPrice: '50000000000',
            gasUsed: '159051',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
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
        // Dollars sent with one-time encryption fee (TX 1)
        {
          node: {
            blockNumber: 1487877,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x0000000000000000000000000000000000007E57',
                    token: 'cUSD',
                    value: '1000000000000000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '10303800000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0x456f41406b32c45d59e539e4bba3d7898c3584da',
                    token: 'cUSD',
                    value: '41215200000000',
                  },
                },
              ],
            },
            feeToken: 'cUSD',
            gasPrice: '500000000',
            gasUsed: '103038',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            input:
              '0xe1d6aceb0000000000000000000000003a42be9c0ce3a98f5b3b0a3f2b9e392126c988fb0000000000000000000000000000000000000000000000000de0b6b3a764000000000000000000000000000000000000000000000000000000000000000000600000000000000000000000000000000000000000000000000000000000000000',
            timestamp: '2020-10-14T09:19:33.000000Z',
            transactionHash: '0x34e6e74bc01c7112817e669a8057ae7f4c1ed49d8de824bea8ecbdb945b41345',
          },
        },
        // Dollars sent with one-time encryption fee (TX 2)
        {
          node: {
            blockNumber: 1487875,
            celoTransfer: {
              edges: [
                {
                  node: {
                    fromAddressHash: '0x0000000000000000000000000000000000007E57',
                    toAddressHash: '0xa12a699c641cc875a7ca57495861c79c33d293b4',
                    token: 'cUSD',
                    value: '18842400000000',
                  },
                },
                {
                  node: {
                    fromAddressHash: '0x3a42be9c0ce3a98f5b3b0a3f2b9e392126c988fb',
                    toAddressHash: '0xb4e92c94a2712e98c020a81868264bde52c188cb',
                    token: 'cUSD',
                    value: '75369600000000',
                  },
                },
              ],
            },
            feeToken: 'cUSD',
            gasPrice: '500000000',
            gasUsed: '188424',
            gatewayFee: '0',
            gatewayFeeRecipient: null,
            input:
              '0x90b12b4700000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000e00000000000000000000000000000000000000000000000000000000000007E57000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000210362915ae5207a3cc69bc98fe02579203702f53641ab91f60aa8756f494326a56000000000000000000000000000000000000000000000000000000000000000',
            timestamp: '2020-10-14T09:19:23.000000Z',
            transactionHash: '0x1a8c50902bd67443f9fcc1842d20dca5d1b9e6dd4a2f83bd214c8d33cb83f253',
          },
        },
      ],
    },
  },
}
export default mockTokenTxs
