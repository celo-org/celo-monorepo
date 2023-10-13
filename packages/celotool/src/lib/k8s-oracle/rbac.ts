import {
  installGenericHelmChart,
  removeGenericHelmChart,
  upgradeGenericHelmChart,
} from 'src/lib/helm_deploy'
import { BaseOracleDeployer } from './base'

// Oracle RBAC------
// We need the oracle pods to be able to change their label to accommodate
// limitations in aad-pod-identity & statefulsets (see https://github.com/Azure/aad-pod-identity/issues/237#issuecomment-611672987)
// To do this, we use an auth token that we get using the resources in the `oracle-rbac` chart

const rbacHelmChartPath = '../helm-charts/oracle-rbac'

/**
 * RbacOracleDeployer cloud-agnostically manages deployments for oracles
 * whose pods must change their metadata in order to accomodate limitations
 * in pod identity solutions (like Azure's aad-pod-identity).
 * This will create a k8s service account for each oracle pod that can modify
 * pod metadata, and will ensure each SA's credentials make their way to the helm chart.
 */
export abstract class RbacOracleDeployer extends BaseOracleDeployer {
  async installChart() {
    await installGenericHelmChart({
      namespace: this.celoEnv,
      releaseName: this.rbacReleaseName(),
      chartDir: rbacHelmChartPath,
      parameters: this.rbacHelmParameters(),
    })
    return super.installChart()
  }

  async upgradeChart() {
    await upgradeGenericHelmChart({
      namespace: this.celoEnv,
      releaseName: this.rbacReleaseName(),
      chartDir: rbacHelmChartPath,
      parameters: this.rbacHelmParameters(),
    })
    return super.upgradeChart()
  }

  async removeChart() {
    await removeGenericHelmChart(this.rbacReleaseName(), this.celoEnv)
    return super.removeChart()
  }

  async helmParameters() {
    const kubeServiceAccountSecretNames = await this.rbacServiceAccountSecretNames()
    return [
      ...(await super.helmParameters()),
      `--set kube.serviceAccountSecretNames='{${kubeServiceAccountSecretNames.join(',')}}'`,
    ]
  }

  rbacHelmParameters() {
    return [
      `--set environment.name=${this.celoEnv}`,
      `--set environment.currencyPair=${this.currencyPair}`,
      `--set oracle.replicas=${this.replicas}`,
    ]
  }

  async rbacServiceAccountSecretNames() {
    return [...Array(this.replicas).keys()].map((i) => {
      return `${this.rbacReleaseName()}-secret-${i}`
    })
  }

  rbacReleaseName() {
    return `${this.celoEnv}-${this.currencyPair.toLocaleLowerCase()}-oracle-rbac`
  }
}
