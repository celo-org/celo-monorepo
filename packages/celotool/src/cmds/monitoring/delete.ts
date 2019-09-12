import { deleteMetric, getMetrics } from 'src/lib/monitoring'
import { CeloEnvArgv } from '../../lib/env-utils'
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
