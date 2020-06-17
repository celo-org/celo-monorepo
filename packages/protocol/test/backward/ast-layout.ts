import { reportLayoutIncompatibilities } from '@celo/protocol/lib/backward/ast-layout'
import { getTestArtifacts } from '@celo/protocol/test/backward/common'
import { assert } from 'chai'

const testCases = {
  original: getTestArtifacts('original'),
  inserted_constant: getTestArtifacts('inserted_constant'),
  appended: getTestArtifacts('appended'),
  inserted: getTestArtifacts('inserted'),
  appended_in_parent: getTestArtifacts('appended_in_parent'),
  removed: getTestArtifacts('removed'),
  typechange: getTestArtifacts('typechange'),
  typechange_in_struct: getTestArtifacts('typechange_in_struct'),
  typechange_in_parent: getTestArtifacts('typechange_in_parent'),
  typechange_in_library_struct: getTestArtifacts('typechange_in_library_struct'),
  removed_from_struct: getTestArtifacts('removed_from_struct'),
  removed_from_parent: getTestArtifacts('removed_from_parent'),
  inserted_in_struct: getTestArtifacts('inserted_in_struct'),
  inserted_in_library_struct: getTestArtifacts('inserted_in_library_struct'),
  removed_from_library_struct: getTestArtifacts('removed_from_library_struct'),
}

const assertCompatible = (report) => {
  assert.isTrue(report.every((contractReport) => contractReport.compatible))
}

const assertNotCompatible = (report) => {
  assert.isFalse(report.every((contractReport) => contractReport.compatible))
}

const selectReportFor = (report, contractName) => {
  return report.find((contractReport) => contractReport.contract === contractName)
}

/* Checks that expected errors were reported for a contract.
 * @param report The list of CompatibilityInfo's to check.
 * @param contractName The name of the contract to check.
 * @param expectedMatches The regular expressions that each successive error for
 * `contractName` should match.
 */
const assertContractErrorsMatch = (report, contractName, expectedMatches) => {
  const contractReport = selectReportFor(report, contractName)
  assert.equal(contractReport.errors.length, 1)

  contractReport.errors.forEach((error, i) => {
    assert.match(error, expectedMatches[i])
  })
}

describe('#reportLayoutIncompatibilities()', () => {
  describe('when the contracts are the same', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.original)
      assertCompatible(report)
    })
  })

  describe('when a constant is inserted in a contract', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.inserted_constant)
      assertCompatible(report)
    })
  })

  describe('when a variable is appended in a contract', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.appended)
      assertCompatible(report)
    })
  })

  describe('when a variable is inserted in a contract', () => {
    it('reports an inserted variable', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.inserted)
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/inserted/])
    })
  })

  describe('when a variable is appended in a parent contract', () => {
    it('reports an inserted variable', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.appended_in_parent)
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/inserted/])
    })
  })

  describe('when a variable is removed in a contract', () => {
    it('reports a removed variable', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.removed)
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/removed/])
    })
  })

  describe('when a variable is removed in a parent contract', () => {
    it('reports a removed variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.removed_from_parent
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/removed/])
    })
  })

  describe(`when a variable's type changes in a contract`, () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.typechange)
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  describe(`when a variable's type changes in a parent contract`, () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.typechange_in_parent
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  describe('when a field is added to a struct', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.inserted_in_struct)
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when a field changes type in a struct', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.typechange_in_struct
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when a field changes type in a library struct', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.typechange_in_library_struct
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when a field is removed from a struct', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.removed_from_struct
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when a field is removed from a library struct', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.removed_from_library_struct
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when a field is inserted in a library struct', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.inserted_in_library_struct
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })
})
