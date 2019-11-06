import {
  ExtractFunctionSignatureTestContract,
  ExtractFunctionSignatureTestInstance,
  TestTransactionsContract,
  TestTransactionsInstance,
} from 'types'

const ExtractFunctionSignatureTest: ExtractFunctionSignatureTestContract = artifacts.require(
  'ExtractFunctionSignatureTest'
)
const TestTransactions: TestTransactionsContract = artifacts.require('TestTransactions')

contract('ExtractFunctionSignatureTest', () => {
  let extractFunctionSignatureTest: ExtractFunctionSignatureTestInstance
  let testTransactions: TestTransactionsInstance

  beforeEach(async () => {
    extractFunctionSignatureTest = await ExtractFunctionSignatureTest.new()
    testTransactions = await TestTransactions.new()
  })

  describe('#extractFunctionSignature', async () => {
    it('should extract the method signature', async () => {
      // @ts-ignore
      const data = testTransactions.contract.methods.setValue(1, 1, true).encodeABI()
      // @ts-ignore
      const signature = web3.eth.abi.encodeFunctionSignature('setValue(uint256,uint256,bool)')
      const result = await extractFunctionSignatureTest.extractFunctionSignature(data)
      assert.equal(result, signature)
    })
  })
})
