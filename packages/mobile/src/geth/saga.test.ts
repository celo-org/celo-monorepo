import { GenesisBlockUtils, StaticNodeUtils } from '@celo/contractkit'
import RNGeth from 'react-native-geth'
import { expectSaga } from 'redux-saga-test-plan'
import { InitializationState } from 'src/geth/reducer'
import { GethInitOutcomes, initGethSaga, waitForGethInstance } from 'src/geth/saga'
import { createMockStore } from 'test/utils'

const mockGethStart = jest.fn()
jest.mock('react-native-geth', () => {
  return jest.fn().mockImplementation(() => {
    return {
      setConfig: jest.fn(),
      start: mockGethStart,
      stop: jest.fn(),
      subscribeNewHead: jest.fn(),
    }
  })
})

describe(initGethSaga, () => {
  beforeAll(() => {
    jest.useRealTimers()
  })

  beforeEach(() => {
    const getStaticNodesAsync = StaticNodeUtils.getStaticNodesAsync as jest.Mock
    getStaticNodesAsync.mockReturnValue(Promise.resolve('enodes'))
    const getGenesisBlockAsync = GenesisBlockUtils.getGenesisBlockAsync as jest.Mock
    getGenesisBlockAsync.mockReturnValue(Promise.resolve({}))
    const RNGethMock = RNGeth as jest.Mock
    RNGethMock.mockClear()
    mockGethStart.mockClear()
  })

  it('initializes the bridge and starts the node', async () => {
    const state = createMockStore({}).getState()
    await expectSaga(waitForGethInstance)
      .withState(state)
      .returns(GethInitOutcomes.SUCCESS)
      .run()
    expect(state.geth.initialized).toEqual(InitializationState.INITIALIZED)
    expect(RNGeth).toHaveBeenCalledTimes(1)
    expect(mockGethStart).toHaveBeenCalledTimes(1)
  })

  it('initializes the bridge but does not start the node in data-saver mode', async () => {
    const state = createMockStore({ web3: { fornoMode: true } }).getState()
    await expectSaga(waitForGethInstance)
      .withState(state)
      .returns(GethInitOutcomes.SUCCESS)
      .run()
    expect(state.geth.initialized).toEqual(InitializationState.INITIALIZED)
    expect(RNGeth).toHaveBeenCalledTimes(1)
    expect(mockGethStart).toHaveBeenCalledTimes(0)
  })
})
