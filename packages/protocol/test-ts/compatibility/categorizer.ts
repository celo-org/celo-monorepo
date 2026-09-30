import { ASTCodeCompatibilityReport } from '@celo/protocol/lib/compatibility/ast-code'
import { DefaultCategorizer } from '@celo/protocol/lib/compatibility/categorizer'
import { StructExpandedChange } from '@celo/protocol/lib/compatibility/change'
import { ASTReports, CategorizedChanges } from '@celo/protocol/lib/compatibility/report'
import { assert } from 'chai'

describe('#CategorizedChanges.fromReports()', () => {
  describe('when a struct held in a mapping gained members at its end', () => {
    const reports = new ASTReports(
      new ASTCodeCompatibilityReport([]),
      [{ contract: 'TestContract', compatible: true, errors: [], expanded: true }],
      []
    )
    const changes = CategorizedChanges.fromReports(reports, new DefaultCategorizer())

    it('categorizes the expansion as a minor change', () => {
      assert.deepEqual(
        changes.minor.map((change) => [
          change.getContract(),
          (change as StructExpandedChange).type,
        ]),
        [['TestContract', 'StructExpanded']]
      )
    })

    it('does not require a major version bump', () => {
      assert.isEmpty(changes.major)
    })

    it('does not report a storage incompatibility', () => {
      assert.isEmpty(changes.storage)
    })
  })
})
