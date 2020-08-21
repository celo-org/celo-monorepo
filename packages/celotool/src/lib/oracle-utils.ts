import { CloudProvider } from './k8s-cluster/base'

export function getCloudProviderFromOracleContext(oracleContext: string): CloudProvider {
  for (const cloudProvider of Object.values(CloudProvider)) {
    if (oracleContext.startsWith(cloudProvider as string)) {
      return CloudProvider[cloudProvider as keyof typeof CloudProvider]
    }
  }
  throw Error(`Oracle context ${oracleContext} must start with one of ${Object.values(CloudProvider)}`)
}
