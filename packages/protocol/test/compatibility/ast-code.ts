import {
  Change,
  DeployedBytecodeChange,
  MethodAddedChange,
  MethodMutabilityChange,
  MethodRemovedChange,
  MethodReturnChange,
  MethodVisibilityChange,
  NewContractChange,
  reportASTIncompatibilities,
} from '@celo/protocol/lib/compatibility/ast-code'
import { getTestArtifacts } from '@celo/protocol/test/compatibility/common'
import { assert } from 'chai'

const testCases = {
  original: getTestArtifacts('original'),
  original_copy: getTestArtifacts('original_copy'),
  inserted_constant: getTestArtifacts('inserted_constant'),
  added_methods_and_contracts: getTestArtifacts('added_methods_and_contracts'),
  big_original: getTestArtifacts('big_original'),
  big_original_modified: getTestArtifacts('big_original_modified'),
}

// @ts-ignore
const comp = (c1: Change, c2: Change): number => {
  const v1 = JSON.stringify(c1)
  const v2 = JSON.stringify(c2)
  if (v1 === v2) {
    return 0
  }
  return v1 < v2 ? 1 : -1
}

describe('#reportASTIncompatibilities()', () => {
  describe('when the contracts are the same', () => {
    it('reports no changes', () => {
      const report = reportASTIncompatibilities(testCases.original, testCases.original_copy)
      assert.isEmpty(report.getChanges())
    })
  })

  describe('when a contract storage is changed', () => {
    it('reports only bytecode changes', () => {
      const report = reportASTIncompatibilities(testCases.original, testCases.inserted_constant)
      const expected = [new DeployedBytecodeChange('TestContract')]
      assert.deepEqual(report.getChanges(), expected)
    })
  })

  describe('when a contract and methods are added', () => {
    it('reports proper changes', () => {
      const report = reportASTIncompatibilities(
        testCases.original,
        testCases.added_methods_and_contracts
      )
      const expected = [
        new NewContractChange('TestContractNew'),
        new DeployedBytecodeChange('TestContract'),
        new MethodAddedChange('TestContract', 'newMethod1(uint256)'),
        new MethodAddedChange('TestContract', 'newMethod2(uint256)'),
      ].sort(comp)
      const changes = report.getChanges()
      changes.sort(comp)
      assert.deepEqual(changes, expected)
    })
  })

  describe('when methods are removed', () => {
    it('reports proper changes', () => {
      const report = reportASTIncompatibilities(
        testCases.added_methods_and_contracts,
        testCases.original
      )
      const expected = [
        new DeployedBytecodeChange('TestContract'),
        new MethodRemovedChange('TestContract', 'newMethod1(uint256)'),
        new MethodRemovedChange('TestContract', 'newMethod2(uint256)'),
      ].sort(comp)
      const changes = report.getChanges()
      changes.sort(comp)
      assert.deepEqual(changes, expected)
    })
  })

  describe('when many changes are made', () => {
    it('reports proper changes', () => {
      const report = reportASTIncompatibilities(
        testCases.big_original,
        testCases.big_original_modified
      )
      const expected = [
        new NewContractChange('NewContract'),
        new DeployedBytecodeChange('ImplementationChangeContract'),
        new DeployedBytecodeChange('MethodsAddedContract'),
        new MethodAddedChange('MethodsAddedContract', 'newMethod1()'),
        new MethodAddedChange('MethodsAddedContract', 'newMethod2(uint256)'),
        new DeployedBytecodeChange('MethodsRemovedContract'),
        new MethodRemovedChange('MethodsRemovedContract', 'someMethod1(uint256)'),
        new MethodRemovedChange('MethodsRemovedContract', 'someMethod2(uint256)'),
        new DeployedBytecodeChange('MethodsModifiedContract'),
        new MethodVisibilityChange(
          'MethodsModifiedContract',
          'someMethod1(uint256)',
          'external',
          'public'
        ),
        new MethodMutabilityChange(
          'MethodsModifiedContract',
          'someMethod2(uint256)',
          'pure',
          'view'
        ),
        new MethodMutabilityChange(
          'MethodsModifiedContract',
          'someMethod4(uint256)',
          'payable',
          'nonpayable'
        ),
        new MethodReturnChange(
          'MethodsModifiedContract',
          'someMethod3(uint256,string)',
          'uint256, memory string',
          'uint256, memory string, uint256'
        ),
      ].sort(comp)
      const changes = report.getChanges()
      changes.sort(comp)
      assert.deepEqual(changes, expected)
    })
  })
})
