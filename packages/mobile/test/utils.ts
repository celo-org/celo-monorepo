/* Utilities to facilitate testing */
import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'
import { InitializationState } from 'src/geth/reducer'
import i18n from 'src/i18n'
import { RootState } from 'src/redux/reducers'
import { getLatestSchema } from 'test/schemas'
import {
  mockAddressToE164Number,
  mockContractAddress,
  mockE164NumberToAddress,
  mockNavigation,
} from 'test/values'

interface MockContract {
  methods: {
    [methodName: string]: MockMethod
  }
  options: {
    address: string
  }
}

type MockMethod = (
  ...params: any
) => { call: () => any; estimateGas: () => number; send: SendMethod }
type SendMethod = (...params: any) => { on: (...params: any) => any }

/**
 * Create a mock contract
 * @param methods object
 */
export function createMockContract(methods: { [methodName: string]: any }) {
  const contract: MockContract = {
    methods: {},
    options: {
      address: mockContractAddress,
    },
  }
  for (const methodName of Object.keys(methods)) {
    const callResult = methods[methodName]
    contract.methods[methodName] = createMockMethod(callResult)
  }
  return contract
}

function createMockMethod(callResult: any): MockMethod {
  return jest.fn(() => ({
    call: jest.fn(() => (typeof callResult === 'function' ? callResult() : callResult)),
    estimateGas: jest.fn(() => 10000),
    send: createSendMethod(),
  }))
}

function createSendMethod(): SendMethod {
  return jest.fn(() => ({
    on: createSendMethod(),
  }))
}

export function createMockNavigationProp(params: any) {
  return {
    ...mockNavigation,
    state: {
      ...mockNavigation.state,
      params,
    },
    getParam: jest.fn(() => params),
  }
}

export function mockNavigationServiceFor(test: string, navigateMock = jest.fn()) {
  const navigate = navigateMock
  const navigateBack = jest.fn()
  const navigateReset = jest.fn()
  navigate.mockName(`${test}@navigate`)
  navigateBack.mockName(`${test}@navigateBack`)
  navigateReset.mockName(`${test}@navigateReset`)
  jest.mock('src/navigator/NavigationService', () => {
    return { navigate, navigateBack, navigateReset }
  })
  return { navigate, navigateBack, navigateReset }
}

const middlewares = [thunk]
const mockStore = configureMockStore(middlewares)

/* Create a mock store with some reasonable default values */
type RecursivePartial<T> = { [P in keyof T]?: RecursivePartial<T[P]> }
export function createMockStore(overrides: RecursivePartial<RootState> = {}) {
  return mockStore(getMockStoreData(overrides))
}

export function getMockStoreData(overrides: RecursivePartial<RootState> = {}): RootState {
  const defaultSchema = getLatestSchema()
  const appConnectedData = {
    geth: { initialized: InitializationState.INITIALIZED, connected: true },
  }
  const contactMappingData = {
    identity: {
      ...defaultSchema.identity,
      addressToE164Number: mockAddressToE164Number,
      e164NumberToAddress: mockE164NumberToAddress,
    },
  }
  const mockStoreData: any = { ...defaultSchema, ...appConnectedData, ...contactMappingData }

  // Apply overrides. Note: only merges one level deep
  for (const key of Object.keys(overrides)) {
    // @ts-ignore
    mockStoreData[key] = { ...mockStoreData[key], ...overrides[key] }
  }

  return mockStoreData
}

export function createMockStoreAppDisconnected() {
  return createMockStore({
    geth: {
      initialized: InitializationState.INITIALIZED,
      connected: false,
    },
    networkInfo: { connected: false },
  })
}

export function getMockI18nProps() {
  return {
    i18n,
    t: i18n.t,
    tReady: true,
  }
}
