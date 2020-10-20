import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from '../cmd-utils'

// Oracle RBAC------
// We need the oracle pods to be able to change their label to accommodate
// limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// To do this, we use an auth token that we get using the resources in the `oracle-rbac` chart

const rbacHelmChartPath = '../helm-charts/oracle-rbac'

export async function installOracleRBACHelmChart(celoEnv: string, replicas: number) {
  return installGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, replicas)
  )
}

export async function upgradeOracleRBACHelmChart(celoEnv: string, replicas: number) {
  return upgradeGenericHelmChart(
    celoEnv,
    rbacReleaseName(celoEnv),
    rbacHelmChartPath,
    rbacHelmParameters(celoEnv, replicas)
  )
}

export function removeOracleRBACHelmRelease(celoEnv: string) {
  return removeGenericHelmChart(rbacReleaseName(celoEnv))
}

function rbacHelmParameters(celoEnv: string, replicas: number) {
  return [`--set environment.name=${celoEnv}`,  `--set oracle.replicas=${replicas}`,]
}

function rbacReleaseName(celoEnv: string) {
  return `${celoEnv}-oracle-rbac`
}

export async function rbacServiceAccountSecretNames(celoEnv: string, replicas: number) {
  const names = [...Array(replicas).keys()].map(i => `${rbacReleaseName(celoEnv)}-${i}`)
  const [tokenName] = await execCmdWithExitOnFailure(
    `kubectl get serviceaccount --namespace=${celoEnv} ${names.join(' ')} -o=jsonpath="{.items[*].secrets[0]['name']}"`
  )
  const tokenNames = tokenName.trim().split(' ')
  return tokenNames
}
