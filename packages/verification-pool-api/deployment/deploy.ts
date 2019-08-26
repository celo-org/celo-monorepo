// Script used for deploying to firebase
// To use call ts-node deploy.ts --celo-env YOUR_ENV_NAME --celo-proj YOUR_PROJECT_NAME

import * as util from '@celo/verification-pool-api/deployment/deployment-utils'
import parseArgs from 'minimist'

async function main() {
  const envArg = parseArgs(process.argv.slice(2))['celo-env']
  try {
    await util.setProject(parseArgs(process.argv.slice(2))['celo-proj'])
  } catch {
    await util.setProject('celo-testnet')
  }
  await util.setEnv(envArg)
  await util.deploy(envArg)
}
main()
