import { getBuildArtifacts } from '@openzeppelin/upgrades'

/* HACK! truffle test was unable to compile this test (TypeScript would end up
 * claiming that it couldn't find the name `assert`) without the following 5
 * lines.
 */
import { MigrationsContract } from 'types'
//@ts-ignore
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
}

describe('reportLayoutIncompatibilities', () => {
  describe('when the contracts are the same', () => {
    it('reports no incompatibilities', () => {
      const report = reportLayoutIncompatibilities(testCases.original, testCases.original)
      assert.isTrue(report.every((contractReport) => contractReport.compatible))
    })
  })
})
