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

export const mockContractAddress = '0x0000000000000000000000000000000000001234'

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
