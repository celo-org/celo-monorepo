import { makeHelmParameters } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from './cmd-utils'
import { outputIncludes } from './utils'


export function helmReleaseName(celoEnv: string) {
  return celoEnv + '-chaos-mesh'
}

export const helmChartDir = '../helm-charts/chaos-mesh'

export function helmParameters() {
  return makeHelmParameters({})
}

export async function deployManifests() {
  // Workaround for managing RBAC permissions bug https://cloud.google.com/kubernetes-engine/docs/how-to/role-based-access-control#iam-rolebinding-bootstrap
  const accountName = (await execCmdWithExitOnFailure(`gcloud config get-value account`))[0]
  const clusterRoleBindingName = `cluster-${accountName.split('@')[0]}-binding`
  const clusterRoleBindingExists = await outputIncludes(
    `kubectl get clusterrolebinding`,
    clusterRoleBindingName,
    `clusterRoleBinding ${clusterRoleBindingName} exists, skipping creation`
  )
  if (!clusterRoleBindingExists) {
    await execCmdWithExitOnFailure(
      `kubectl create clusterrolebinding "${clusterRoleBindingName}" \
       --clusterrole cluster-admin \
       --user ${accountName}`
    )
  }

  await execCmdWithExitOnFailure(`kubectl apply -f ${helmChartDir}/manifests`)
}
