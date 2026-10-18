import { ContractAST } from '@celo/protocol/lib/compatibility/contract-ast'
import { getArtifactByName } from '@celo/protocol/lib/compatibility/internal'
import { getTestArtifacts } from '@celo/protocol/test-ts/util/compatibility'
import { assert } from 'chai'

describe('ContractAST', () => {
  describe('#getMethods()', () => {
    const [artifacts] = getTestArtifacts('multiple_in_file')
    const selectors = new ContractAST(getArtifactByName('TestContract', artifacts), artifacts)
      .getMethods()
      .map((method) => method.selector as string)

    it('keeps a method whatever its name', () => {
      assert.include(selectors, 'isConstructor()')
    })

    it('leaves out the constructor', () => {
      assert.notInclude(selectors, '()')
    })
  })
})
