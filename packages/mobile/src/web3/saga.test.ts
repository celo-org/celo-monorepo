import { expectSaga } from 'redux-saga-test-plan'
import { call, delay } from 'redux-saga/effects'
import { navigateToError } from 'src/navigator/NavigationService'
import { completeWeb3Sync, updateWeb3SyncProgress } from 'src/web3/actions'
import { getContractKitOutsideGenerator } from 'src/web3/contracts'
import { checkWeb3SyncProgress, SYNC_TIMEOUT, waitForWeb3Sync } from 'src/web3/saga'
import { sleep } from 'test/utils'

const LAST_BLOCK_NUMBER = 200

jest.mock('src/account/actions', () => ({
  ...jest.requireActual('src/account/actions'),
  getPincode: async () => 'pin',
}))

jest.mock('src/navigator/NavigationService', () => ({
  navigateToError: jest.fn().mockReturnValueOnce(undefined),
}))

const state = { web3: {} }

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
    const contractKit = await getContractKitOutsideGenerator()
    contractKit.web3.eth.isSyncing
      // @ts-ignore
      .mockReturnValueOnce({
        startingBlock: 0,
        currentBlock: 10,
        highestBlock: 100,
      })
      .mockReturnValueOnce(false)

    // @ts-ignore
    await expectSaga(checkWeb3SyncProgress)
      .withState(state)
      .provide([[delay(100), true]])
      .put(updateWeb3SyncProgress({ startingBlock: 0, currentBlock: 10, highestBlock: 100 })) // is syncing the first time
      .put(completeWeb3Sync(LAST_BLOCK_NUMBER)) // finished syncing the second time
      .returns(true)
      .run()
  })
})
