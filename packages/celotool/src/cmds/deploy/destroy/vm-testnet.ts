import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import {
  destroyTerraformModule,
  initTerraformModule,
  planTerraformModule,
} from '@celo/celotool/src/lib/terraform'
import { confirmAction, envVar, fetchEnv } from '@celo/celotool/src/lib/utils'

export const command = 'vm-testnet'
export const describe = 'destroy an existing VM-based testnet'

export const builder = {}

const terraformModule = 'testnet'

export const handler = async (argv: DestroyArgv) => {
  const envType = fetchEnv(envVar.ENV_TYPE)
  console.info(`Destroying ${argv.celoEnv} in environment ${envType}`)

  console.info('Initializing...')
  await initTerraformModule(terraformModule)

  console.info('Planning...')
  await planTerraformModule(terraformModule, true)

  await confirmAction(`Are you sure you want to destroy ${argv.celoEnv} in environment ${envType}?`)

  await destroyTerraformModule(terraformModule)
}
