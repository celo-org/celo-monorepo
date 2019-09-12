import { getMetrics } from 'src/lib/monitoring'
import { CeloEnvArgv } from '../../lib/env-utils'
export const command = 'list'

export const describe = 'list metrics'

interface DeleteMetricsArgv extends CeloEnvArgv {
  prefix: string
}

export const builder = (argv: CeloEnvArgv) => {
  argv.option('prefix', {
    required: true,
    type: 'string',
    alias: 'p',
  })
}

export const handler = async (argv: DeleteMetricsArgv) => {
  const metrics = await getMetrics(argv.prefix)
  // tslint:disable-next-line: no-console
  console.log(metrics.map((m) => m.name))
}
