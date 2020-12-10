import {
  attachPolicyIdempotent,
  createPolicyIdempotent,
  createRoleIdempotent,
  deletePolicy,
  deleteRole,
  detachPolicyIdempotent,
  getEKSNodeInstanceGroupRoleArn,
  getKeyArnFromAlias,
  getPolicyArn
} from '../aws'
import { AwsClusterConfig } from "../k8s-cluster/aws"
import { BaseOracleDeploymentConfig, OracleIdentity } from "./base"
import { RbacOracleDeployer } from './rbac'

/**
 * Contains information needed when using Azure HSM signing
 */
export interface AwsHsmOracleIdentity extends OracleIdentity {
  keyAlias: string
  region: string
}

export interface AwsHsmOracleDeploymentConfig extends BaseOracleDeploymentConfig {
  identities: AwsHsmOracleIdentity[],
  clusterConfig: AwsClusterConfig
}

/**
 * AwsHsmOracleDeployer manages deployments for HSM-based oracles on AWS
 */
export class AwsHsmOracleDeployer extends RbacOracleDeployer {
  // Explicitly specify this so we enforce AwsHsmOracleDeploymentConfig
  constructor(deploymentConfig: AwsHsmOracleDeploymentConfig, celoEnv: string) {
    super(deploymentConfig, celoEnv)
  }

  async removeChart() {
    await super.removeChart()
    for (const identity of this.deploymentConfig.identities) {
      await this.deleteAwsHsmRoleAndPolicyIdempotent(identity)
    }
  }

  async helmParameters() {
    return [
      ...await super.helmParameters(),
      `--set kube.cloudProvider=aws`,
      `--set oracle.walletType=AWS_HSM`
    ]
  }

  async oracleIdentityHelmParameters() {
    let params = await super.oracleIdentityHelmParameters()
    for (let i = 0; i < this.replicas; i++) {
      const identity = this.deploymentConfig.identities[i]
      const prefix = `--set oracle.identities[${i}]`
      const awsRoleArn = await this.createAwsHsmRoleIdempotent(identity)
      params = params.concat([
        `${prefix}.aws.roleArn=${awsRoleArn}`,
      ])
    }
    return params
  }

  /**
   * Creates an AWS role for a specific oracle identity with the
   * appropriate permissions to use its HSM.
   * Idempotent.
   */
  async createAwsHsmRoleIdempotent(identity: AwsHsmOracleIdentity) {
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
    const roleName = this.awsHsmRoleName(identity)
    const roleArn = await createRoleIdempotent(roleName, JSON.stringify(rolePolicy))
    const policyName = this.awsHsmPolicyName(identity)
    const keyArn = await getKeyArnFromAlias(identity.keyAlias, identity.region)
    const policyArn = await this.createAwsHsmSignPolicyIdempotent(policyName, keyArn)
    await attachPolicyIdempotent(roleName, policyArn)
    return roleArn
  }

  /**
   * Creates an AWS policy to allow usage of an HSM.
   * Idempotent.
   */
  async createAwsHsmSignPolicyIdempotent(policyName: string, keyArn: string) {
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

  /**
   * Deletes both the AWS role and policy for a particular identity.
   * Note this assumes that the policy has only been attached to the corresponding
   * role and no others. This may not be the case if someone manually attaches
   * the policy to a different role in the AWS console.
   */
  async deleteAwsHsmRoleAndPolicyIdempotent(identity: AwsHsmOracleIdentity) {
    const roleName = this.awsHsmRoleName(identity)
    const policyName = this.awsHsmPolicyName(identity)
    console.info(`Deleting AWS role ${roleName} and policy ${policyName}`)
    const policyArn = await getPolicyArn(policyName)
    if (policyArn) {
      // Don't throw if it's not attached
      try {
        await detachPolicyIdempotent(roleName, policyArn)
      } catch (e) {
        console.info(`Could not detatch policy ${policyArn} from role ${roleName}:`, e.message)
      }
      await deletePolicy(policyArn)
    }
    try {
      await deleteRole(roleName)
    } catch (e) {
      console.info(`Could not delete role ${roleName}:`, e.message)
    }
  }

  awsHsmRoleName(identity: AwsHsmOracleIdentity) {
    return `${identity.keyAlias}-${identity.address}`.substring(0, 64)
  }

  awsHsmPolicyName(identity: AwsHsmOracleIdentity) {
    return `${identity.keyAlias}-${identity.address}`
  }

  get deploymentConfig(): AwsHsmOracleDeploymentConfig {
    return this._deploymentConfig as AwsHsmOracleDeploymentConfig
  }
}
