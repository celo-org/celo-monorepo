// Script used for deploying to firebase
// To use call ts-node deploy.ts --celo-env YOUR_ENV_NAME --celo-proj YOUR_PROJECT_NAME

import * as util from '@celo/verification-pool-api/deployment/deployment-utils'
import * as parseArgs from 'minimist'

const envArg = parseArgs(process.argv.slice(2))['celo-env']
util.setProject(parseArgs(process.argv.slice(2))['celo-proj'])
util.setEnv(envArg)
util.deploy(envArg)
