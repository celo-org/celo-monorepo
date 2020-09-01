import { GenesisBlockUtils, StaticNodeUtils } from '@celo/contractkit'
import GethBridge from 'react-native-geth'
import { expectSaga } from 'redux-saga-test-plan'
import { InitializationState } from 'src/geth/reducer'
import { _waitForGethInit, GethInitOutcomes, initGethSaga } from 'src/geth/saga'
import { createMockStore } from 'test/utils'

describe(initGethSaga, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    const getStaticNodesAsync = StaticNodeUtils.getStaticNodesAsync as jest.Mock
    getStaticNodesAsync.mockReturnValue(Promise.resolve('enodes'))
    const getGenesisBlockAsync = GenesisBlockUtils.getGenesisBlockAsync as jest.Mock
    getGenesisBlockAsync.mockReturnValue(Promise.resolve({}))
    const MockGethBridge = (GethBridge as unknown) as Record<string, jest.Mock>
    MockGethBridge.startNode.mockClear()
  })

  it('initializes the bridge and starts the node', async () => {
    const state = createMockStore({}).getState()
    await expectSaga(_waitForGethInit)
      .withState(state)
      .returns(GethInitOutcomes.SUCCESS)
      .run()
    expect(state.geth.initialized).toEqual(InitializationState.INITIALIZED)
    expect(GethBridge.startNode).toHaveBeenCalledTimes(1)
  })

  it('initializes the bridge but does not start the node in data-saver mode', async () => {
    const state = createMockStore({ web3: { fornoMode: true } }).getState()
    await expectSaga(_waitForGethInit)
      .withState(state)
      .returns(GethInitOutcomes.SUCCESS)
      .run()
    expect(state.geth.initialized).toEqual(InitializationState.INITIALIZED)
    expect(GethBridge.startNode).toHaveBeenCalledTimes(0)
  })
})
