import { installGenericHelmChart, removeGenericHelmChart, upgradeGenericHelmChart } from 'src/lib/helm_deploy'
import { execCmdWithExitOnFailure } from '../cmd-utils'
import { BaseOracleDeployer } from './base'

// Oracle RBAC------
// We need the oracle pods to be able to change their label to accommodate
// limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// To do this, we use an auth token that we get using the resources in the `oracle-rbac` chart

const rbacHelmChartPath = '../helm-charts/oracle-rbac'

/**
 * RbacOracleDeployer cloud-agnostically manages deployments for oracles
 * whose pods must change their metadata in order to accomodate limitations
 * in pod identity solutions (like Azure's aad-pod-identity and AWS's kube2iam).
 * This will create a k8s service account for each oracle pod that can modify
 * pod metadata, and will ensure each SA's credentials make their way to the helm chart.
 */
export abstract class RbacOracleDeployer extends BaseOracleDeployer {
  async installChart() {
    await installGenericHelmChart(
      this.celoEnv,
      this.rbacReleaseName(),
      rbacHelmChartPath,
      this.rbacHelmParameters()
    )
    return super.installChart()
  }

  async upgradeChart() {
    await upgradeGenericHelmChart(
      this.celoEnv,
      this.rbacReleaseName(),
      rbacHelmChartPath,
      this.rbacHelmParameters()
    )
    return super.upgradeChart()
  }

  async removeChart() {
    await removeGenericHelmChart(this.rbacReleaseName(), this.celoEnv)
    return super.removeChart()
  }

  async helmParameters() {
    const kubeServiceAccountSecretNames = await this.rbacServiceAccountSecretNames()
    return [
      ...await super.helmParameters(),
      `--set kube.serviceAccountSecretNames='{${kubeServiceAccountSecretNames.join(',')}}'`
    ]
  }

  rbacHelmParameters() {
    return [`--set environment.name=${this.celoEnv}`, `--set oracle.replicas=${this.replicas}`]
  }

  async rbacServiceAccountSecretNames() {
    const names = [...Array(this.replicas).keys()].map(i => `${this.rbacReleaseName()}-${i}`)
    const [tokenName] = await execCmdWithExitOnFailure(
      `kubectl get serviceaccount --namespace=${this.celoEnv} ${names.join(' ')} -o=jsonpath="{.items[*].secrets[0]['name']}"`
    )
    const tokenNames = tokenName.trim().split(' ')
    return tokenNames
  }

  rbacReleaseName() {
    return `${this.celoEnv}-oracle-rbac`
  }
}
