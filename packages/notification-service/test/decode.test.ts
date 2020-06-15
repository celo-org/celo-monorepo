import { Log } from '../src/blockscout/blockscout'
import { decodeLogs } from '../src/blockscout/decode'

const TX_LOGS: Log[] = [
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
  },
  {
    transactionIndex: '0',
    transactionHash: '0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126',
    topics: [
      '0xe5d4e30fb8364e57bc4d662a07d0cf36f4c34552004c4c3624620a2c1d1c03dc',
      null,
      null,
      null,
    ],
    timeStamp: '5EA989EB',
    logIndex: '1',
    gatewayFeeRecipient: '0xec58ea26ad82952432ead416314cd8f37512fdd8',
    gatewayFee: '0',
    gasUsed: '1BC63',
    gasPrice: 'BA43B7400',
    feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
    data:
      '0x00000000000000000000000000000000000000000000000000000000000000200000000000000000000000000000000000000000000000000000000000000003596f330000000000000000000000000000000000000000000000000000000000',
    blockNumber: '518A6',
    address: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
  },
  {
    transactionIndex: '0',
    transactionHash: '0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000bc8326cd83f3b9b7970352a06094a7d92b6323ca',
      '0x000000000000000000000000a12a699c641cc875a7ca57495861c79c33d293b4',
      null,
    ],
    timeStamp: '5EA989EB',
    logIndex: '2',
    gatewayFeeRecipient: '0xec58ea26ad82952432ead416314cd8f37512fdd8',
    gatewayFee: '0',
    gasUsed: '1BC63',
    gasPrice: 'BA43B7400',
    feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
    data: '0x00000000000000000000000000000000000000000000000000040aab20092c00',
    blockNumber: '518A6',
    address: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
  },
  {
    transactionIndex: '0',
    transactionHash: '0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000bc8326cd83f3b9b7970352a06094a7d92b6323ca',
      '0x000000000000000000000000050f34537f5b2a00b9b9c752cb8500a3fce3da7d',
      null,
    ],
    timeStamp: '5EA989EB',
    logIndex: '3',
    gatewayFeeRecipient: '0xec58ea26ad82952432ead416314cd8f37512fdd8',
    gatewayFee: '0',
    gasUsed: '1BC63',
    gasPrice: 'BA43B7400',
    feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
    data: '0x00000000000000000000000000000000000000000000000000102aac8024b000',
    blockNumber: '518A6',
    address: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
  },
  {
    transactionIndex: '0',
    transactionHash: '0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126',
    topics: [
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
      '0x000000000000000000000000bc8326cd83f3b9b7970352a06094a7d92b6323ca',
      '0x000000000000000000000000ec58ea26ad82952432ead416314cd8f37512fdd8',
      null,
    ],
    timeStamp: '5EA989EB',
    logIndex: '4',
    gatewayFeeRecipient: '0xec58ea26ad82952432ead416314cd8f37512fdd8',
    gatewayFee: '0',
    gasUsed: '1BC63',
    gasPrice: 'BA43B7400',
    feeCurrency: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
    data: '0x0000000000000000000000000000000000000000000000000000000000000000',
    blockNumber: '518A6',
    address: '0xa561131a1c8ac25925fb848bca45a74af61e5a38',
  },
]

describe('decodeLogs', () => {
  it('should decode logs', () => {
    const { transfers, latestBlock } = decodeLogs(TX_LOGS)
    expect(latestBlock).toBe(333990)

    // The last transfers are transaction fees
    expect(transfers).toMatchInlineSnapshot(`
      Map {
        "0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126" => Array [
          Object {
            "blockNumber": 333990,
            "comment": "Yo3",
            "recipient": "0x936d29a333c0a2254fc785fc38b535f4c51c082a",
            "sender": "0xbc8326cd83f3b9b7970352a06094a7d92b6323ca",
            "timestamp": 1588169195000,
            "txHash": "0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126",
            "value": "54331585667327701",
          },
          Object {
            "blockNumber": 333990,
            "comment": "Yo3",
            "recipient": "0xa12a699c641cc875a7ca57495861c79c33d293b4",
            "sender": "0xbc8326cd83f3b9b7970352a06094a7d92b6323ca",
            "timestamp": 1588169195000,
            "txHash": "0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126",
            "value": "1137630000000000",
          },
          Object {
            "blockNumber": 333990,
            "comment": "Yo3",
            "recipient": "0x050f34537f5b2a00b9b9c752cb8500a3fce3da7d",
            "sender": "0xbc8326cd83f3b9b7970352a06094a7d92b6323ca",
            "timestamp": 1588169195000,
            "txHash": "0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126",
            "value": "4550520000000000",
          },
          Object {
            "blockNumber": 333990,
            "comment": "Yo3",
            "recipient": "0xec58ea26ad82952432ead416314cd8f37512fdd8",
            "sender": "0xbc8326cd83f3b9b7970352a06094a7d92b6323ca",
            "timestamp": 1588169195000,
            "txHash": "0xdcaa21f784824ace60221a63e12f6748cf992a4db727aa240c3487e6849cc126",
            "value": "0",
          },
        ],
      }
    `)
  })
})
