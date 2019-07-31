import { Transfer } from '../src/blockscout/blockscout'
import { filterAndJoinTransfers } from '../src/blockscout/transfers'

const TRANSFER1: Transfer = {
  recipient: 'recipient',
  sender: 'sender',
  value: '1',
  blockNumber: 123,
  txHash: 'txhash',
  timestamp: 1,
}

const TRANSFER2: Transfer = {
  recipient: 'recipient',
  sender: 'sender',
  value: '1',
  blockNumber: 124,
  txHash: 'txhash2',
  timestamp: 1,
}

jest.mock('../src/config', () => ({
  BLOCKSCOUT_API: '',
  STABLE_TOKEN_ADDRESS: '',
  GOLD_TOKEN_ADDRESS: '',
  Currencies: '',
}))

jest.mock('../src/firebase')

jest.mock('../src/blockscout/transfers', () => ({
  notifyForNewTransfers: jest.fn(() => 'notified!'),
  ...jest.requireActual('../src/blockscout/transfers'),
}))

describe('Transfers', () => {
  it('should exclude exchanges', () => {
    const goldTransfers = new Map<string, Transfer>()
    const stableTransfers = new Map<string, Transfer>()

    goldTransfers.set('txhash', TRANSFER1)
    stableTransfers.set('txhash', TRANSFER1)

    const concated = filterAndJoinTransfers(goldTransfers, stableTransfers)

    expect(concated).toEqual([])
  })

  it('should include unique transactions', () => {
    const goldTransfers = new Map<string, Transfer>()
    const stableTransfers = new Map<string, Transfer>()

    goldTransfers.set('txhash', TRANSFER1)
    stableTransfers.set('txhash2', TRANSFER2)

    const concated = filterAndJoinTransfers(goldTransfers, stableTransfers)

    expect(concated).toEqual([TRANSFER1, TRANSFER2])
  })
})
