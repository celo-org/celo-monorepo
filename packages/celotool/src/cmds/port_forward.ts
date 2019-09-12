import { switchToClusterFromEnv } from 'src/lib/cluster'
import * as yargs from 'yargs'
import { addCeloEnvMiddleware, CeloEnvArgv } from '../lib/env-utils'
import { defaultPortsString, portForward } from '../lib/port_forward'
export const command = 'port-forward'

export const describe = 'command for port-forwarding to a specific network'

interface PortForwardArgv extends CeloEnvArgv {
  component: string
  ports: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('component', {
      type: 'string',
      description: 'K8s component name to forward to',
    })
    .option('ports', {
      type: 'string',
      description: 'Ports to forward: space separated srcport:dstport string',
      default: defaultPortsString,
    })
}

export const handler = async (argv: PortForwardArgv) => {
  await switchToClusterFromEnv(false)
  await portForward(argv.celoEnv, argv.component, argv.ports)
}
