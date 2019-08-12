import { InitialArgv } from '@celo/celotool/src/cmds/deploy/initial'
import { uploadGenesisBlockToGoogleStorage } from '@celo/celotool/src/lib/testnet-utils'
import { confirmAction, envVar, fetchEnv } from '@celo/celotool/src/lib/utils'
import { generateAndUploadSecrets } from '@celo/celotool/src/lib/vm-testnet-utils'

import {
  applyTerraformModule,
  initTerraformModule,
  planTerraformModule,
} from '@celo/celotool/src/lib/terraform'

export const command = 'vm-testnet'

export const describe = 'deploy a testnet on a VM'

export const builder = {}

type VMTestnetInitialArgv = InitialArgv

const terraformModule = 'testnet'

export const handler = async (argv: VMTestnetInitialArgv) => {
  const envType = fetchEnv(envVar.ENV_TYPE)
  console.info(`Deploying ${argv.celoEnv} in environment ${envType}`)

  console.info('Initializing...')
  await initTerraformModule(terraformModule)

  console.info('Planning...')
  await planTerraformModule(terraformModule)

  await confirmAction(
    `Are you sure you want to perform the above plan for Celo env ${
      argv.celoEnv
    } in environment ${envType}?`
  )

  console.info('Generating and uploading secrets env files to Google Storage...')
  await generateAndUploadSecrets(argv.celoEnv)

  console.info('Applying...')
  await applyTerraformModule(terraformModule)

  await uploadGenesisBlockToGoogleStorage(argv.celoEnv)
}
