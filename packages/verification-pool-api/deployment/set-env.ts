// Script used for setting firebase environemnt specific config
// To use call ts-node set-env.ts --celo-env YOUR_ENV_NAME

import { setEnv } from '@celo/verification-pool-api/deployment/deployment-utils'
import * as parseArgs from 'minimist'

setEnv(parseArgs(process.argv.slice(2))['celo-env'])
