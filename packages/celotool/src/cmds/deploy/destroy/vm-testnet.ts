import { DestroyArgv } from '@celo/celotool/src/cmds/deploy/destroy'
import {
  destroyTerraformModule,
  initTerraformModule,
  planTerraformModule,
} from '@celo/celotool/src/lib/terraform'
import { confirmAction, envVar, fetchEnv } from '@celo/celotool/src/lib/utils'
import { destroy } from '@celo/celotool/src/lib/vm-testnet-utils'

export const command = 'vm-testnet'
export const describe = 'destroy an existing VM-based testnet'

export const builder = {}

const terraformModule = 'testnet'

export const handler = async (argv: DestroyArgv) => {
  await destroy(argv.celoEnv)
}
