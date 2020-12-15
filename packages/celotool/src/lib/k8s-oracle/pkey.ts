import { BaseOracleDeployer, BaseOracleDeploymentConfig, OracleIdentity } from "./base";

export interface PrivateKeyOracleIdentity extends OracleIdentity {
  privateKey: string
}

export interface PrivateKeyOracleDeploymentConfig extends BaseOracleDeploymentConfig {
  identities: PrivateKeyOracleIdentity[]
}

/**
 * PrivateKeyOracleDeployer cloud-agnostically manages deployments for oracles
 * that are using in-memory signing via private keys
 */
export class PrivateKeyOracleDeployer extends BaseOracleDeployer {
  constructor(deploymentConfig: PrivateKeyOracleDeploymentConfig, celoEnv: string) {
    super(deploymentConfig, celoEnv)
  }

  async helmParameters() {
    return [
      ...await super.helmParameters(),
      `--set oracle.walletType=PRIVATE_KEY`
    ]
  }

  async oracleIdentityHelmParameters() {
    const params: string[] = await super.oracleIdentityHelmParameters()
    for (let i = 0; i < this.replicas; i++) {
      const oracleIdentity = this.deploymentConfig.identities[i]
      const prefix = `--set oracle.identities[${i}]`
      params.push(`${prefix}.privateKey=${oracleIdentity.privateKey}`)
    }
    return params
  }

  get deploymentConfig(): PrivateKeyOracleDeploymentConfig {
    return this._deploymentConfig as PrivateKeyOracleDeploymentConfig
  }
}
