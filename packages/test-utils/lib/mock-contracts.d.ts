interface MockContract {
  methods: {
    [methodName: string]: MockMethod
  }
  options: {
    address: string
  }
}
declare type MockMethod = (
  ...params: any
) => {
  call: () => any
  estimateGas: () => number
  send: SendMethod
}
declare type SendMethod = (
  ...params: any
) => {
  on: (...params: any) => any
}
export declare const mockContractAddress = '0x0000000000000000000000000000000000001234'
export declare function createMockContract(methods: { [methodName: string]: any }): MockContract
export {}
