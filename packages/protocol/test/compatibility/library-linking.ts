import { assert } from 'chai'

import { reportASTIncompatibilities } from '@celo/protocol/lib/compatibility/ast-code'
import { reportLibraryLinkingIncompatibilities } from '@celo/protocol/lib/compatibility/library-linking'
import { getTestArtifacts } from '@celo/protocol/test/compatibility/common'

const testCases = {
  linked_libraries: getTestArtifacts('linked_libraries'),
  linked_libraries_upgraded_lib: getTestArtifacts('linked_libraries_upgraded_lib'),
}

describe('reportLibraryLinkingIncompatibilities', () => {
  it('detects when a linked library has changed', () => {
    const codeReport = reportASTIncompatibilities(
      [testCases.linked_libraries],
      [testCases.linked_libraries_upgraded_lib]
    )
    const libraryLinksReport = reportLibraryLinkingIncompatibilities(
      {
        LinkedLibrary1: ['TestContract'],
        LinkedLibrary2: ['TestContract'],
        LinkedLibrary3: ['LinkedLibrary2'],
      },
      codeReport
    )
    assert.equal(libraryLinksReport.length, 2)

    const library2Change = libraryLinksReport.find(
      (change) => change.getContract() === 'LinkedLibrary2'
    )
    assert.isDefined(library2Change)
    assert.equal(library2Change.getDependency(), 'LinkedLibrary3')

    const contractChange = libraryLinksReport.find(
      (change) => change.getContract() === 'TestContract'
    )
    assert.isDefined(contractChange)
    assert.equal(contractChange.getDependency(), 'LinkedLibrary2')
  })
})
