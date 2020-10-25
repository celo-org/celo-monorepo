import { OracleIdentity, BaseOracleDeployer, BaseOracleDeploymentConfig } from "./base";

/**
 * Contains information needed when using Azure HSM signing
 */
export interface PrivateKeyOracleIdentity extends OracleIdentity {
  privateKey: string
}

export interface PrivateKeyOracleDeploymentConfig extends BaseOracleDeploymentConfig {
  identities: PrivateKeyOracleIdentity[],
}

export class PrivateKeyOracleDeployer extends BaseOracleDeployer {
  constructor(deploymentConfig: PrivateKeyOracleDeploymentConfig, celoEnv: string) {
    super(deploymentConfig, celoEnv)
  }

  async oracleIdentityHelmParameters() {
    let params: string[] = await super.oracleIdentityHelmParameters()
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
