import { makeHelmParameters } from 'src/lib/helm_deploy'
import { envVar, fetchEnv } from 'src/lib/utils'

export function helmReleaseName(celoEnv: string) {
  return celoEnv + '-pumba'
}

export const helmChartDir = '../helm-charts/pumba'

export function helmParameters() {
  return makeHelmParameters({
    'pumba.interval': fetchEnv(envVar.CHAOS_TEST_INTERVAL),
    'pumba.duration': fetchEnv(envVar.CHAOS_TEST_DURATION),
    'pumba.networkDelay': fetchEnv(envVar.CHAOS_TEST_NETWORK_DELAY),
    'pumba.networkJitter': fetchEnv(envVar.CHAOS_TEST_NETWORK_JITTER),
    'pumba.networkLoss': fetchEnv(envVar.CHAOS_TEST_NETWORK_LOSS),
    'pumba.networkRate': fetchEnv(envVar.CHAOS_TEST_NETWORK_RATE),
  })
}
