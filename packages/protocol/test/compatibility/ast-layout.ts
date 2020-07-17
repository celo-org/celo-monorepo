import { getBuildArtifacts } from '@openzeppelin/upgrades'

/* HACK! truffle test was unable to compile this test (TypeScript would end up
 * claiming that it couldn't find the name `assert`) without the following
 * lines.
 */
import { MigrationsContract } from 'types'
// @ts-ignore
const Migrations: MigrationsContract = artifacts.require('Migrations')

import { reportLayoutIncompatibilities } from '@celo/protocol/lib/layout'

/* We store artifacts for the various test cases in ./test/resources/layout
 * For each test case, there should be a build_<test case name> directory with
 * truffle-compile output, and contracts_<test case name> directory with the
 * corresponding contracts.
 *
 * The base for most of these tests is in contracts_original
 */
const getTestArtifacts = (caseName: string) => {
  return getBuildArtifacts(`./test/resources/layout/build_${caseName}`)
}

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

  original_complex: getTestArtifacts('original_complex'),
  shorter_fixed_array: getTestArtifacts('shorter_fixed_array'),
  longer_fixed_array: getTestArtifacts('longer_fixed_array'),
  fixed_to_dynamic_array: getTestArtifacts('fixed_to_dynamic_array'),
  dynamic_to_fixed_array: getTestArtifacts('dynamic_to_fixed_array'),
  mapping_source_changed: getTestArtifacts('mapping_source_changed'),
  internal_mapping_source_changed: getTestArtifacts('internal_mapping_source_changed'),
  mapping_target_changed: getTestArtifacts('mapping_target_changed'),
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

  describe('when a fixed array has length increased', () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_complex,
        testCases.longer_fixed_array
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  describe('when a fixed array has length decreased', () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_complex,
        testCases.shorter_fixed_array
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  describe('when a fixed array becomes dynamic', () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_complex,
        testCases.fixed_to_dynamic_array
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  describe('when a dynamic array becomes fixed', () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_complex,
        testCases.dynamic_to_fixed_array
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  // TODO(m-chrzan): @openzeppelin/upgrades erases information about mapping key
  // types before generating a layout diff. We might want to patch this behavior
  // so that this sort of type change is identified as a backwards
  // incompatibility.
  describe.skip('when the source of a mapping changes', () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_complex,
        testCases.mapping_source_changed
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  describe.skip('when the source of a nested mapping changes', () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_complex,
        testCases.internal_mapping_source_changed
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  describe('when the target of a mapping changes', () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_complex,
        testCases.mapping_target_changed
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })
})
