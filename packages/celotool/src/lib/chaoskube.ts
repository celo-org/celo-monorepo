import { makeHelmParameters } from 'src/lib/helm_deploy'
import { envVar, fetchEnv } from 'src/lib/utils'

export function helmReleaseName(celoEnv: string) {
  return celoEnv + '-chaoskube'
}

export const helmChartDir = 'stable/chaoskube'

export function helmParameters(celoEnv: string) {
  return makeHelmParameters({
    interval: fetchEnv(envVar.CHAOS_TEST_KILL_INTERVAL),
    labels: 'component=validators',
    namespaces: celoEnv,
    dryRun: 'false',
    'rbac.create': 'true',
    'rbac.serviceAccountName': `${celoEnv}-chaoskube`,
  })
}
