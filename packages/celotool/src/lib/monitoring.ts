import { MetricServiceClient } from '@google-cloud/monitoring'

interface Metric {
  name: string
}
const client = new MetricServiceClient()

export async function getMetrics(prefix: string): Promise<Metric[]> {
  return new Promise((resolve, reject) => {
    client.listMetricDescriptors(
      {
        name: 'projects/celo-testnet',
        filter: `metric.type = starts_with("custom.googleapis.com/${prefix}")`,
      },
      (error: Error, metrics: any[]) => {
        if (error) {
          reject(error)
        } else {
          resolve(metrics)
        }
      }
    )
  })
}

export async function deleteMetric(name: string) {
  // tslint:disable-next-line: no-console
  console.log(`Delete metric ${name}`)
  return client.deleteMetricDescriptor({ name })
}
