// Script used for deploying to firebase
// To use call ts-node deploy.ts --celo-env YOUR_ENV_NAME --celo-proj YOUR_PROJECT_NAME

import * as util from './deployment-utils'
import parseArgs from 'minimist'

const envArg = parseArgs(process.argv.slice(2))['celo-env']
const project = parseArgs(process.argv.slice(2))['celo-proj'] || 'celo-testnet'
util.setProject(project)
util.setEnv(envArg)
util.deploy(envArg)
