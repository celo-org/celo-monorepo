// Script used for deleting from firebase
// To use call ts-node delete.ts --celo-env YOUR_ENV_NAME --celo-proj YOUR_PROJECT_NAME

import * as util from '@celo/verification-pool-api/deployment/deployment-utils'
import * as parseArgs from 'minimist'

util.setProject(parseArgs(process.argv.slice(2))['celo-proj'])
util.deleteDeployment(parseArgs(process.argv.slice(2))['celo-env'])
