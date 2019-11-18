import { envVar, fetchEnv } from 'src/lib/env-utils'
import { installGenericHelmChart } from 'src/lib/helm_deploy'

const helmChartPath = '../helm-charts/oracle'

export async function installHelmChart(celoEnv: string) {
  return installGenericHelmChart(celoEnv, releaseName(celoEnv), helmChartPath, helmParameters())
}

function helmParameters() {
  return [`--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`]
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-oracle`
}
