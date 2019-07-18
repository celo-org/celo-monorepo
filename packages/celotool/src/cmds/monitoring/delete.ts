import { CeloEnvArgv } from '@celo/celotool/src/lib/utils'
import { deleteMetric, getMetrics } from 'src/lib/monitoring'
export const command = 'delete'

export const describe = 'delete metrics'

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
  await Promise.all(metrics.map((metric) => deleteMetric(metric.name)))
}
