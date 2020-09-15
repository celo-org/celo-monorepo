import { range } from 'lodash'
// import {
//   deallocateStaticIP,
//   getAKSNodeResourceGroup,
//   registerStaticIPIfNotRegistered,
//   waitForStaticIPDetachment
// } from '../azure'
import { execCmd } from '../cmd-utils'
import { GCPClusterConfig } from '../k8s-cluster/gcp'
// import { deleteResource } from '../kubernetes'
import { BaseFullNodeDeployer, BaseFullNodeDeploymentConfig } from './base'
import { deleteIPAddress, registerIPAddress, retrieveIPAddress } from '../helm_deploy'
//
export interface GCPFullNodeDeploymentConfig extends BaseFullNodeDeploymentConfig {
  clusterConfig: GCPClusterConfig,
}

export class GCPFullNodeDeployer extends BaseFullNodeDeployer {
  async additionalHelmParameters() {
    const staticIps = (await this.allocateStaticIPs()).join(',')
    return [
      `--set gcp=true`,
      `--set storage.storageClass=ssd`,
      `--set geth.public_ip_per_node='{${staticIps}}'`,
      `--set ingress.enabled=true`,
      `--set ingress.annotations."kubernetes\\.io/tls-acme"=true`,
      `--set ingress.annotations."nginx\\.ingress\\.kubernetes\\.io/enable-cors"=true`,
      `--set ingress.tls[0].secretName=${this.celoEnv}-forno-web-tls`,
      `--set ingress.tls[0].hosts[0]=${this.celoEnv}-forno-testing.celo-testnet.org`,
      `--set ingress.hosts[0]=${this.celoEnv}-forno-testing.celo-testnet.org`,
    ]
  }

  async allocateStaticIPs() {
    const allocateIPPromises = range(this.deploymentConfig.replicas).map((index: number) =>
      registerIPAddress(
        this.getIPAddressName(index),
        this.deploymentConfig.clusterConfig.zone
      )
    )
    await Promise.all([
      ...allocateIPPromises,
      this.deallocateIPsWithNames(await this.ipAddressNamesToDeallocate()),
    ])
    return Promise.all(
      range(this.deploymentConfig.replicas).
        map((index: number) => retrieveIPAddress(
          this.getIPAddressName(index),
          this.deploymentConfig.clusterConfig.zone
        ))
    )
  }

  async ipAddressNamesToDeallocate(intendedReplicas: number = this.deploymentConfig.replicas) {
    const [allMatchesRaw] = await execCmd(
      `gcloud compute addresses list --filter="name~'${this.ipAddressPrefix}-[0-9]+'" --format json`
    )
    const allMatches = JSON.parse(allMatchesRaw)
    const getReplicaFromIPName = (ipName: string) => {
      const regex = new RegExp(`${this.ipAddressPrefix}-([0-9]+)`, 'g')
      const matches = regex.exec(ipName)
      if (matches == null) {
        return null
      }
      return parseInt(matches[1], 10)
    }
    return allMatches
      .filter((ipDescription: any) => {
        const replica = getReplicaFromIPName(ipDescription.name)
        return replica != null && replica >= intendedReplicas
      })
      .map((ipDescription: any) => ipDescription.name)
  }

  async deallocateIPsWithNames(names: string[]) {
    await Promise.all(
      names.map((name: string) => deleteIPAddress(name, this.deploymentConfig.clusterConfig.zone))
    )
  }

  async deallocateAllIPs() {
    const ipNamesToDeallocate = await this.ipAddressNamesToDeallocate(0)
    await this.deallocateIPsWithNames(ipNamesToDeallocate)
  }

  getIPAddressName(index: number) {
    return `${this.ipAddressPrefix}-${index}`
  }

  get ipAddressPrefix() {
    return `${this.celoEnv}-${this.deploymentConfig.clusterConfig.clusterName}`
  }

  get deploymentConfig(): GCPFullNodeDeploymentConfig {
    return this._deploymentConfig as GCPFullNodeDeploymentConfig
  }
}
