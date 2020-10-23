import { BaseOracleDeployer, BaseOracleDeploymentConfig, OracleIdentity } from "./base"
import {
  createPolicyIdempotent,
  getEKSNodeInstanceGroupRoleArn,
  getKeyArnFromAlias,
  createRoleIdempotent,
  attachPolicyIdempotent
} from '../aws'
import { AWSClusterConfig } from "../k8s-cluster/aws"
import { installOracleRBACHelmChart, rbacServiceAccountSecretNames, removeOracleRBACHelmRelease, upgradeOracleRBACHelmChart } from './rbac'

/**
 * Contains information needed when using Azure HSM signing
 */
export interface AWSOracleHSMIdentity extends OracleIdentity {
  // identityName: string
  keyAlias: string
  // If a resource group is not specified, it is assumed to be the same
  // as the kubernetes cluster resource group specified in the AKSClusterConfig
  region: string
}

export interface AWSOracleDeploymentConfig extends BaseOracleDeploymentConfig {
  identities: AWSOracleHSMIdentity[],
  clusterConfig: AWSClusterConfig
}

export class AWSOracleDeployer extends BaseOracleDeployer {

  // Explicitly specify this so we enforce AWSOracleDeploymentConfig
  constructor(deploymentConfig: AWSOracleDeploymentConfig, celoEnv: string) {
    super(deploymentConfig, celoEnv)
  }

  async installChart() {
    // First install the oracle-rbac helm chart.
    // This must be deployed before so we can use a resulting auth token so that
    // oracle pods can reach the K8s API server to change their aad labels
    await installOracleRBACHelmChart(this.celoEnv, this.replicas)
    await super.installChart()
  }

  async upgradeChart() {
    await upgradeOracleRBACHelmChart(this.celoEnv, this.replicas)
    await super.upgradeChart()
  }

  async removeChart() {
    await removeOracleRBACHelmRelease(this.celoEnv)
    await super.removeChart()
    // for (const identity of this.deploymentConfig.identities) {
    //   await deleteOracleAzureIdentity(this.deploymentConfig.context, identity)
    // }
  }

  async helmParameters() {
    const kubeServiceAccountSecretNames = await rbacServiceAccountSecretNames(this.celoEnv, this.replicas)
    return [
      ...await super.helmParameters(),
      `--set kube.serviceAccountSecretNames='{${kubeServiceAccountSecretNames.join(',')}}'`
    ]
  }

  // async helmParameters() {
  //   return [
  //     ...await super.helmParameters(),
  //     // `--set `
  //   ]
  // }

  async oracleIdentityHelmParameters() {
    let params = await super.oracleIdentityHelmParameters()
    for (let i = 0; i < this.replicas; i++) {
      const identity = this.deploymentConfig.identities[i]
      const prefix = `--set oracle.identities[${i}]`
      const awsRoleArn = await this.createAWSOracleHSMRoleIdempotent(identity)
      params = params.concat([
        `${prefix}.aws.roleArn=${awsRoleArn}`,
      ])
    }
    return params
  }

  async createAWSOracleHSMRoleIdempotent(identity: AWSOracleHSMIdentity) {
    // The role that each node (ie VM) uses
    const nodeInstanceGroupRoleArn = await getEKSNodeInstanceGroupRoleArn(this.deploymentConfig.clusterConfig.clusterName)
    // This is a "trust relationship" that allows the node instance group role
    // to assume this role (via kube2iam).
    const rolePolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: '',
          Effect: 'Allow',
          Principal: {
            AWS: nodeInstanceGroupRoleArn
          },
          Action: 'sts:AssumeRole'
        }
      ]
    }
    const roleName = this.awsOracleHSMRoleName(identity)
    console.log('roleName', roleName)
    const roleArn = await createRoleIdempotent(roleName, JSON.stringify(rolePolicy))
    console.log('roleArn', roleArn)
    const policyName = this.awsOracleHSMPolicyName(identity)
    console.log('policyName', policyName)
    const keyArn = await getKeyArnFromAlias(identity.keyAlias, identity.region)
    console.log('keyArn', keyArn)
    const policyArn = await createAWSOracleHSMSignPolicyIdempotent(policyName, keyArn)
    console.log('policyArn', policyArn)
    await attachPolicyIdempotent(roleName, policyArn)
    return roleArn
  }

  awsOracleHSMRoleName(identity: AWSOracleHSMIdentity) {
    return `${identity.keyAlias}-${identity.address}-sign-role`.substring(0, 64)
  }

  awsOracleHSMPolicyName(identity: AWSOracleHSMIdentity) {
    return `${identity.keyAlias}-${identity.address}-sign-policy`
  }

  get deploymentConfig(): AWSOracleDeploymentConfig {
    return this._deploymentConfig as AWSOracleDeploymentConfig
  }
}



async function createAWSOracleHSMSignPolicyIdempotent(policyName: string, keyArn: string) {
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'VisualEditor0',
        Effect: 'Allow',
        Action: [
          'kms:GetPublicKey',
          'kms:DescribeKey',
          'kms:Sign'
        ],
        Resource: keyArn
      },
      {
        Sid: 'VisualEditor1',
        Effect: 'Allow',
        Action: 'kms:ListKeys',
        Resource: '*'
      }
    ]
  }
  return createPolicyIdempotent(policyName, JSON.stringify(policy))
}
