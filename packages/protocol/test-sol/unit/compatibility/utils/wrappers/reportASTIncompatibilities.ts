const fs = require('node:fs')
import { reportASTIncompatibilities } from '@celo/protocol/lib/compatibility/ast-code'
import { instantiateArtifactsFromForge } from '@celo/protocol/lib/compatibility/utils'

const getBuildArtifacts = (caseName: string) => {
  return instantiateArtifactsFromForge(`test-sol-resources/compatibility/build/out_${caseName}`)
}

const oldArtifacts = getBuildArtifacts(process.argv[2])
const newArtifacts = getBuildArtifacts(process.argv[3])
const outputFile = process.argv[4]

const report = reportASTIncompatibilities(oldArtifacts, newArtifacts)

fs.writeFileSync(outputFile, JSON.stringify(report))
