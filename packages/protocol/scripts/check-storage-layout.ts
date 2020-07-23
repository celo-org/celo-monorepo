import { getBuildArtifacts } from '@openzeppelin/upgrades'
import { CompatibilityInfo, reportLayoutIncompatibilities } from '../lib/layout'

const args = process.argv.slice(2)

if (args.length !== 2) {
  console.error(
    'USAGE: check-storage-layout <artifacts-directory-before> <artifacts-directory-after>'
  )
  process.exit(1)
}

const buildDirectory1 = args[0]
const buildDirectory2 = args[1]
const artifacts1 = getBuildArtifacts(buildDirectory1)
const artifacts2 = getBuildArtifacts(buildDirectory2)

const compatibilityReport = reportLayoutIncompatibilities(artifacts1, artifacts2)

const printIncompatibility = (incompatibility: CompatibilityInfo) => {
  console.error(
    `ERROR: upgraded storage of ${incompatibility.contract} is not backwards compatible!`
  )
  incompatibility.errors.forEach((error) => console.error(`  ${error}`))
}

const printReport = (report: CompatibilityInfo[]) => {
  report.forEach((contractReport) => {
    if (!contractReport.compatible) {
      printIncompatibility(contractReport)
    }
  })
}

if (compatibilityReport.some((report) => !report.compatible)) {
  printReport(compatibilityReport)
  process.exit(1)
}
