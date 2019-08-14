import { expectSaga } from 'redux-saga-test-plan'
import { call, delay, select } from 'redux-saga/effects'
import { pincodeSelector } from 'src/account/reducer'
import { waitForGethConnectivity } from 'src/geth/saga'
import { navigateToError } from 'src/navigator/NavigationService'
import {
  getLatestBlock,
  setLatestBlockNumber,
  setSyncProgress,
  updateWeb3SyncProgress,
} from 'src/web3/actions'
import {
  _CHECK_SYNC_PROGRESS_TIMEOUT,
  _checkWeb3SyncProgressClaim,
  checkWeb3Sync,
  createNewAccount,
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
    },
  },
}))

const state = createMockStore({ web3: { account: mockAccount } }).getState()

describe(createNewAccount, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  it('returns an existing account', async () => {
    await expectSaga(createNewAccount)
      .withState(state)
      .provide([[select(currentAccountSelector), '123']])
      .returns('123')
      .run()
  })

  it('creates a new account', async () => {
    await expectSaga(createNewAccount)
      .withState(state)
      .provide([[select(currentAccountSelector), null]])
      .provide([[select(pincodeSelector), '123']])
      .returns('0x0000000000000000000000000000000000007E57')
      .run()
  })
})

describe(checkWeb3Sync, () => {
  it('reports connection successfully', async () => {
    await expectSaga(checkWeb3Sync)
      .withState(state)
      .provide([
        [call(waitForGethConnectivity), true],
        // needs this async function to win the race with a delay
        [call(_checkWeb3SyncProgressClaim), call(async () => true)],
        [call(getLatestBlock), { number: LAST_BLOCK_NUMBER }],
      ])
      .put(setLatestBlockNumber(LAST_BLOCK_NUMBER))
      .run()
  })

  it('times out', async () => {
    await expectSaga(checkWeb3Sync)
      .withState(state)
      .provide([
        [call(waitForGethConnectivity), true],
        [call(_checkWeb3SyncProgressClaim), call(sleep, 100)], // sleep so timeout always wins the race
        [delay(_CHECK_SYNC_PROGRESS_TIMEOUT), true],
        [call(getLatestBlock), { number: LAST_BLOCK_NUMBER }],
      ])
      .run()
    expect(navigateToError).toHaveBeenCalled()
  })
})

describe(_checkWeb3SyncProgressClaim, () => {
  it('reports web3 status correctly', async () => {
    await expectSaga(_checkWeb3SyncProgressClaim)
      .withState(state)
      .put(updateWeb3SyncProgress({ startingBlock: 0, currentBlock: 10, highestBlock: 100 })) // is syncing the first time
      .put(setSyncProgress(100)) // finished syncing the second time
      .returns(true)
      .run()
  })
})
