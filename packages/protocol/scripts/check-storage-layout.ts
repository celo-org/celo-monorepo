import { getBuildArtifacts, Operation } from '@openzeppelin/upgrades'
import { getLayoutDiff } from '../lib/layout'

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
    }
  })
}

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
  process.exit(1)
}
