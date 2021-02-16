import { TokenTransfer } from '../src/blockscout/blockscout'
import { formatNativeTransfers } from '../src/blockscout/nativeTransfersFormatter'

const TRANSFERS: TokenTransfer[] = [
  {
    transactionIndex: '0',
    transactionHash: '0x924d9446580937be2a0aecf952e9c96186501eeef5a0af1873ef5863f9d3fa2b',
    topics: [null, null, null, null],
    toAddressHash: '0x6131a6d616a4be3737b38988847270a64bc10caa',
    timeStamp: '601C5884',
    logIndex: '',
    gatewayFeeRecipient: '',
    gatewayFee: '0',
    gasUsed: '3879E',
    gasPrice: '580AD3BA',
    fromAddressHash: '0xa7ed835288aa4524bb6c73dd23c0bf4315d9fe3e',
    feeCurrency: '0x874069fa1eb16d44d622f2e0ca25eea172369bc1',
    data: '',
    blockNumber: '347FDD',
    amount: '1105441065380215190',
    address: '0xf194afdf50b03e69bd7d057c1aa9e10c9954e4c9',
  },
  {
    transactionIndex: '0',
    transactionHash: '0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000bc8326cd83f3b9b7970352a06094a7d92b6323ca',
      '0x000000000000000000000000936d29a333c0a2254fc785fc38b535f4c51c082a',
      null,
    ],
    timeStamp: '5EA989EB',
    logIndex: '0',
    gatewayFeeRecipient: '0xec58ea26ad82952432ead416314cd8f37512fdd8',
    gatewayFee: '0',
    gasUsed: '1BC63',
    gasPrice: 'BA43B7400',
    feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
    data: '0x00000000000000000000000000000000000000000000000000c1064a0fc8e6d5',
    blockNumber: '518A6',
    address: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
    toAddressHash: '0x6131a6d616a4be3737b38988847270a64bc10caa',
    fromAddressHash: '0xa7ed835288aa4524bb6c73dd23c0bf4315d9fe3e',
    amount: '1105441065380215190',
  },
]

describe('formatNativeTransfers', () => {
  it('should format transfers correctly', () => {
    const { transfers, latestBlock } = formatNativeTransfers(TRANSFERS)
    expect(latestBlock).toBe(3440605)

    // The second transaction uses an ERC-20 token so it's ignored.
    expect(transfers).toMatchInlineSnapshot(`
      Map {
        "0x924d9446580937be2a0aecf952e9c96186501eeef5a0af1873ef5863f9d3fa2b" => Array [
          Object {
            "blockNumber": 3440605,
            "recipient": "0x6131a6d616a4be3737b38988847270a64bc10caa",
            "sender": "0xa7ed835288aa4524bb6c73dd23c0bf4315d9fe3e",
            "timestamp": 1612470404000,
            "txHash": "0x924d9446580937be2a0aecf952e9c96186501eeef5a0af1873ef5863f9d3fa2b",
            "value": "1105441065380215190",
          },
        ],
      }
    `)
  })
})
