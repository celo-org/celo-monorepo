import {
  reportLayoutIncompatibilities,
  ASTStorageCompatibilityReport,
} from '@celo/protocol/lib/compatibility/ast-layout'
import { getTestArtifacts } from '@celo/protocol/test-ts/util/compatibility'
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

  original_complex: getTestArtifacts('original_complex'),
  shorter_fixed_array: getTestArtifacts('shorter_fixed_array'),
  longer_fixed_array: getTestArtifacts('longer_fixed_array'),
  fixed_to_dynamic_array: getTestArtifacts('fixed_to_dynamic_array'),
  dynamic_to_fixed_array: getTestArtifacts('dynamic_to_fixed_array'),
  mapping_source_changed: getTestArtifacts('mapping_source_changed'),
  internal_mapping_source_changed: getTestArtifacts('internal_mapping_source_changed'),
  mapping_target_changed: getTestArtifacts('mapping_target_changed'),

  original_struct_in_mapping: getTestArtifacts('original_struct_in_mapping'),
  inserted_in_struct_mapping: getTestArtifacts('inserted_in_struct_mapping'),
  inserted_in_library_struct_mapping: getTestArtifacts('inserted_in_library_struct_mapping'),
  inserted_front_in_struct_mapping: getTestArtifacts('inserted_front_in_struct_mapping'),
  original_two_structs_in_mapping: getTestArtifacts('original_two_structs_in_mapping'),
  original_struct_uses: getTestArtifacts('original_struct_uses'),
  appended_to_struct_in_array: getTestArtifacts('appended_to_struct_in_array'),
  appended_to_nested_struct: getTestArtifacts('appended_to_nested_struct'),
  reordered_enum_in_struct_mapping: getTestArtifacts('reordered_enum_in_struct_mapping'),
  appended_enum_in_struct_mapping: getTestArtifacts('appended_enum_in_struct_mapping'),
  appended_to_first_of_two_structs_in_mapping: getTestArtifacts(
    'appended_to_first_of_two_structs_in_mapping'
  ),
  inserted_middle_in_struct_mapping: getTestArtifacts('inserted_middle_in_struct_mapping'),
  deprecated_prefixed_in_library_struct_mapping: getTestArtifacts(
    'deprecated_prefixed_in_library_struct_mapping'
  ),
  deprecated_prefixed_in_struct: getTestArtifacts('deprecated_prefixed_in_struct'),
  deprecated_prefixed_variable: getTestArtifacts('deprecated_prefixed_variable'),
}

const assertCompatible = (report: ASTStorageCompatibilityReport[]) => {
  assert.isTrue(report.every((contractReport) => contractReport.compatible))
}

const assertNotCompatible = (report: ASTStorageCompatibilityReport[]) => {
  assert.isFalse(report.every((contractReport) => contractReport.compatible))
}

const selectReportFor = (
  report: ASTStorageCompatibilityReport[],
  contractName: string
): ASTStorageCompatibilityReport => {
  return report.find((contractReport) => contractReport.contract === contractName)
}

/* Checks that expected errors were reported for a contract.
 * @param report The list of CompatibilityInfo's to check.
 * @param contractName The name of the contract to check.
 * @param expectedMatches The regular expressions that each successive error for
 * `contractName` should match.
 */
const assertContractErrorsMatch = (
  report: ASTStorageCompatibilityReport[],
  contractName: string,
  expectedMatches: RegExp[]
) => {
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

  describe('when a field is added to a struct in mapping', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_in_mapping,
        testCases.inserted_in_struct_mapping
      )
      assertCompatible(report)
      assert.isTrue(selectReportFor(report, 'TestContract').expanded)
    })
  })

  // Array elements and struct members are laid out one after the other, so a longer struct
  // shifts everything stored after the first one.
  describe('when a field is appended to a struct stored in an array', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_uses,
        testCases.appended_to_struct_in_array
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when a field is appended to a struct nested in a struct in mapping', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_uses,
        testCases.appended_to_nested_struct
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when an enum used by a struct in mapping is reordered', () => {
    it('reports a changed member type', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_uses,
        testCases.reordered_enum_in_struct_mapping
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/member kind changed type/])
    })
  })

  describe('when an enum used by a struct in mapping gains a member at its end', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_uses,
        testCases.appended_enum_in_struct_mapping
      )
      assertCompatible(report)
    })
  })

  describe('when only one of several structs in mappings grows', () => {
    it('records the expansion whichever struct is compared last', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_two_structs_in_mapping,
        testCases.appended_to_first_of_two_structs_in_mapping
      )
      assertCompatible(report)
      assert.isTrue(selectReportFor(report, 'TestContract').expanded)
    })
  })

  // Appending is only safe at the end: a field inserted before existing ones shifts them
  // within every entry already stored in the mapping.
  describe('when a field is inserted at the front of a struct in mapping', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_in_mapping,
        testCases.inserted_front_in_struct_mapping
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when a field is inserted in the middle of a struct in mapping', () => {
    it('reports a struct change', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_in_mapping,
        testCases.inserted_middle_in_struct_mapping
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/struct.*changed/])
    })
  })

  describe('when a field is added to a library struct in mapping', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_in_mapping,
        testCases.inserted_in_library_struct_mapping
      )
      assertCompatible(report)
    })
  })

  describe('when a field is prefixed with deprecated to a library struct in mapping', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_struct_in_mapping,
        testCases.deprecated_prefixed_in_library_struct_mapping
      )
      assertCompatible(report)
    })
  })

  describe('when a field is prefixed with deprecated to struct variable', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.deprecated_prefixed_in_struct
      )
      assertCompatible(report)
    })
  })

  describe('when a variable is prefixed with deprecated', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original,
        testCases.deprecated_prefixed_variable
      )
      assertCompatible(report)
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

  describe('when the source of a mapping changes', () => {
    it('reports a typechanged variable', () => {
      const report = reportLayoutIncompatibilities(
        testCases.original_complex,
        testCases.mapping_source_changed
      )
      assertNotCompatible(report)
      assertContractErrorsMatch(report, 'TestContract', [/had type/])
    })
  })

  describe('when the source of a nested mapping changes', () => {
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
