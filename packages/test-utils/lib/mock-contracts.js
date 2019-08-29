'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.mockContractAddress = '0x0000000000000000000000000000000000001234'
function createMockContract(methods) {
  var contract = {
    methods: {},
    options: {
      address: exports.mockContractAddress,
    },
  }
  for (var _i = 0, _a = Object.keys(methods); _i < _a.length; _i++) {
    var methodName = _a[_i]
    var callResult = methods[methodName]
    contract.methods[methodName] = createMockMethod(callResult)
  }
  return contract
}
exports.createMockContract = createMockContract
function createMockMethod(callResult) {
  return jest.fn(function() {
    return {
      call: jest.fn(function() {
        return typeof callResult === 'function' ? callResult() : callResult
      }),
      estimateGas: jest.fn(function() {
        return 10000
      }),
      send: createSendMethod(),
    }
  })
}
function createSendMethod() {
  return jest.fn(function() {
    return {
      on: createSendMethod(),
    }
  })
}
//# sourceMappingURL=mock-contracts.js.map
