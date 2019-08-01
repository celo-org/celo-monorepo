import { Log, Response, Transfer } from '../src/blockscout/blockscout'
import {
  filterAndJoinTransfers,
  handleTransferNotifications,
  notifyForNewTransfers,
} from '../src/blockscout/transfers'

export let TRANSFER1: Transfer
export let TRANSFER2: Transfer
export let sendPaymentNotificationMock: any
export let getLastBlockNotifiedMock: any
export let setLastBlockNotifiedMock: any
export let decodeLogsMock: any

const response: Response<Log> = {
  status: '',
  result: [
    {
      transactionIndex: '',
      transactionHash: '',
      topics: [''],
      timeStamp: '',
      logIndex: '',
      gasUsed: '',
      gasPrice: '',
      data: '',
      blockNumber: '',
      address: '',
    },
  ],
  message: '',
}

jest.mock('../src/config', () => ({
  BLOCKSCOUT_API: '',
  STABLE_TOKEN_ADDRESS: '',
  GOLD_TOKEN_ADDRESS: '',
}))

jest.mock('node-fetch', () => ({
  ...jest.requireActual('node-fetch'),
  __esModule: true,
  default: jest.fn(() => ({ json: jest.fn(() => response) })),
}))

jest.mock('firebase-admin')

jest.mock('../src/firebase', () => {
  sendPaymentNotificationMock = jest.fn(() => {
    return new Promise<void>((resolve) => setTimeout(resolve, 1000))
  })
  getLastBlockNotifiedMock = jest.fn(() => 120)
  setLastBlockNotifiedMock = jest.fn((newblock) => newblock)
  return {
    sendPaymentNotification: sendPaymentNotificationMock,
    getLastBlockNotified: getLastBlockNotifiedMock,
    setLastBlockNotified: setLastBlockNotifiedMock,
  }
})

jest.mock('../src/blockscout/decode', () => {
  TRANSFER1 = {
    recipient: 'recipient',
    sender: 'sender',
    value: '1',
    blockNumber: 123,
    txHash: 'txhash',
    timestamp: 1,
  }
  TRANSFER2 = {
    recipient: 'recipient',
    sender: 'sender',
    value: '1',
    blockNumber: 124,
    txHash: 'txhash2',
    timestamp: 1,
  }
  const goldTransfers = new Map<string, Transfer>()
  const stableTransfers = new Map<string, Transfer>()

  goldTransfers.set('txhash', TRANSFER1)
  stableTransfers.set('txhash2', TRANSFER2)

  decodeLogsMock = jest
    .fn()
    .mockReturnValueOnce({ transfers: goldTransfers, latestBlock: 123 })
    .mockReturnValueOnce({ transfers: stableTransfers, latestBlock: 124 })

  return {
    ...jest.requireActual('../src/blockscout/decode'),
    decodeLogs: decodeLogsMock,
  }
})

describe('Transfers', () => {
  it('should exclude exchanges', () => {
    const goldTransfers = new Map<string, Transfer>()
    const stableTransfers = new Map<string, Transfer>()

    goldTransfers.set('txhash', TRANSFER1)
    stableTransfers.set('txhash', TRANSFER1)

    const concated = filterAndJoinTransfers(goldTransfers, stableTransfers)

    expect(concated).toEqual([])
  })

  it('should include unique transactions and update the last block', () => {
    const goldTransfers = new Map<string, Transfer>()
    const stableTransfers = new Map<string, Transfer>()

    goldTransfers.set('txhash', TRANSFER1)
    stableTransfers.set('txhash2', TRANSFER2)

    const concated = filterAndJoinTransfers(goldTransfers, stableTransfers)

    expect(concated).toEqual([TRANSFER1, TRANSFER2])
  })

  it('should notify for new transfers since last block notified', async () => {
    const transfers = [TRANSFER1, TRANSFER2]
    const lastBlockNotified = 122
    const returned = await notifyForNewTransfers(transfers, lastBlockNotified)

    expect(sendPaymentNotificationMock).toHaveBeenCalled()
    expect(returned.length).toEqual(transfers.length)
  })

  it('should skip for transfers older than last block notified', async () => {
    const transfers = [TRANSFER1, TRANSFER2]
    const lastBlockNotified = 130
    const returned = await notifyForNewTransfers(transfers, lastBlockNotified)

    expect(sendPaymentNotificationMock).toHaveBeenCalled()
    expect(returned.length).toEqual(0)
  })

  it('should update the last set block number', async () => {
    await handleTransferNotifications()
    expect(setLastBlockNotifiedMock).toBeCalledWith(
      Math.max(TRANSFER1.blockNumber, TRANSFER2.blockNumber)
    )
  })
})
