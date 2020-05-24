<<<<<<< HEAD
<<<<<<< HEAD
import { getBuildArtifacts } from '@openzeppelin/upgrades'
import { CompatibilityInfo, reportLayoutIncompatibilities } from '../lib/layout'
=======
import { getBuildArtifacts, Operation } from '@openzeppelin/upgrades'
import { getLayoutDiff } from '../lib/layout'
>>>>>>> Add script for layout checking
=======
import { getBuildArtifacts } from '@openzeppelin/upgrades'
<<<<<<< HEAD
import { reportLayoutIncompatibilities, CompatibilityInfo } from '../lib/layout'
>>>>>>> Move functions from script to library
=======
import { CompatibilityInfo, reportLayoutIncompatibilities } from '../lib/layout'
>>>>>>> Appease the linter

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

<<<<<<< HEAD
<<<<<<< HEAD
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
=======
// Checks that a layout diff consists only of appending new variables.
const appendOnlyDiff = (diff: Operation[]) => {
  return diff.every((operation) => operation.action === 'append')
}

const reportDiff = (diff: Operation[]) => {
  console.log(`ERROR: ${diff[0].updated.contract}'s layout has changed`)
  diff.forEach((operation) => {
    const updated = operation.updated
    const original = operation.original
    switch (operation.action) {
      case 'typechange':
        console.log(
          `  variable ${updated.label} had type ${original.type}, now has type ${updated.type}`
        )
        break
      case 'insert':
        console.log(`  variable ${updated.label} was inserted`)
        break
      case 'pop':
        console.log(`  variable ${original.label} was removed`)
        break
      case 'rename':
        console.log(`  variable ${updated.label} was renamed from ${original.label}`)
        break
      default:
        console.log(operation)
>>>>>>> Add script for layout checking
=======
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
>>>>>>> Move functions from script to library
    }
  })
}

<<<<<<< HEAD
<<<<<<< HEAD
if (compatibilityReport.some((report) => !report.compatible)) {
  printReport(compatibilityReport)
=======
let backwardsIncompatibilities = 0

artifacts2.listArtifacts().forEach((newArtifact) => {
  const oldArtifact = artifacts1.getArtifactByName(newArtifact.contractName)
  if (oldArtifact !== undefined) {
    const layoutDiff = getLayoutDiff(oldArtifact, artifacts1, newArtifact, artifacts2)
    if (!appendOnlyDiff(layoutDiff)) {
      backwardsIncompatibilities++
      reportDiff(layoutDiff)
    }
  }
})

if (backwardsIncompatibilities > 0) {
>>>>>>> Add script for layout checking
=======
if (compatibilityReport.some((report) => !report.compatible)) {
  printReport(compatibilityReport)
>>>>>>> Move functions from script to library
  process.exit(1)
}
