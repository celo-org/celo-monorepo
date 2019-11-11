import { expectSaga } from 'redux-saga-test-plan'
import { call, delay, select } from 'redux-saga/effects'
import { pincodeTypeSelector } from 'src/account/reducer'
import { navigateToError } from 'src/navigator/NavigationService'
import { setLatestBlockNumber, updateWeb3SyncProgress } from 'src/web3/actions'
import {
  checkWeb3SyncProgress,
  getDecryptedData,
  getEncryptedData,
  getOrCreateAccount,
  SYNC_TIMEOUT,
  waitForWeb3Sync,
} from 'src/web3/saga'
import { currentAccountSelector } from 'src/web3/selectors'
import { createMockStore, sleep } from 'test/utils'
import { mockAccount } from 'test/values'

const LAST_BLOCK_NUMBER = 1000

jest.mock('src/account/actions', () => ({
  ...jest.requireActual('src/account/actions'),
  getPincode: async () => 'pin',
}))

jest.mock('src/navigator/NavigationService', () => ({
  navigateToError: jest.fn().mockReturnValueOnce(undefined),
}))

jest.mock('src/web3/contracts', () => ({
  web3: {
    eth: {
      isSyncing: jest
        .fn()
        .mockReturnValueOnce({ startingBlock: 0, currentBlock: 10, highestBlock: 100 })
        .mockReturnValueOnce(false),
      getBlock: jest.fn(() => ({ number: 1000 })),
    },
  },
  isZeroSyncMode: jest.fn().mockReturnValueOnce(false),
}))

const state = createMockStore({ web3: { account: mockAccount } }).getState()

describe(getOrCreateAccount, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('returns an existing account', async () => {
    await expectSaga(getOrCreateAccount)
      .withState(state)
      .provide([[select(currentAccountSelector), '123']])
      .returns('123')
      .run()
  })

  it('creates a new account', async () => {
    await expectSaga(getOrCreateAccount)
      .withState(state)
      .provide([[select(currentAccountSelector), null]])
      .provide([[select(pincodeTypeSelector), '123']])
      .returns('0x0000000000000000000000000000000000007e57')
      .run()
  })
})

describe(waitForWeb3Sync, () => {
  it('reports connection successfully', async () => {
    await expectSaga(waitForWeb3Sync)
      .withState(state)
      .provide([
        // needs this async function to win the race with a delay
        [call(checkWeb3SyncProgress), call(async () => true)],
      ])
      .returns(true)
      .run()
  })

  it('times out', async () => {
    await expectSaga(waitForWeb3Sync)
      .withState(state)
      .provide([
        [call(checkWeb3SyncProgress), call(sleep, 100)], // sleep so timeout always wins the race
        [delay(SYNC_TIMEOUT), true],
      ])
      .returns(false)
      .run()
    expect(navigateToError).toHaveBeenCalled()
  })
})

describe(checkWeb3SyncProgress, () => {
  it('reports web3 status correctly', async () => {
    await expectSaga(checkWeb3SyncProgress)
      .withState(state)
      .put(updateWeb3SyncProgress({ startingBlock: 0, currentBlock: 10, highestBlock: 100 })) // is syncing the first time
      .put(setLatestBlockNumber(LAST_BLOCK_NUMBER)) // finished syncing the second time
      .returns(true)
      .run()
  })
})

describe(getEncryptedData, () => {
  it('encrypts and decrypts correctly', () => {
    const data = 'testing data'
    const password = 'a random password'
    const encryptedBuffer: Buffer = getEncryptedData(data, password)
    console.debug(`Encrypted data is ${encryptedBuffer.toString('hex')}`)
    const decryptedData: string = getDecryptedData(encryptedBuffer, password)
    console.debug(`Decrypted data is \"${decryptedData}\"`)
    expect(decryptedData).toBe(data)
  })
})
