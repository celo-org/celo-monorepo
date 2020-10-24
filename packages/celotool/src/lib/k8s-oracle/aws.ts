import { BaseOracleDeploymentConfig, OracleIdentity } from "./base"
import {
  createPolicyIdempotent,
  getEKSNodeInstanceGroupRoleArn,
  getKeyArnFromAlias,
  createRoleIdempotent,
  attachPolicyIdempotent,
  getPolicyArn,
  deletePolicy,
  deleteRole,
  detachPolicyIdempotent
} from '../aws'
import { AwsClusterConfig } from "../k8s-cluster/aws"
import { RbacOracleDeployer } from './rbac'

/**
 * Contains information needed when using Azure HSM signing
 */
export interface AwsHsmOracleIdentity extends OracleIdentity {
  keyAlias: string
  // If a resource group is not specified, it is assumed to be the same
  // as the kubernetes cluster resource group specified in the AKSClusterConfig
  region: string
}

export interface AwsHsmOracleDeploymentConfig extends BaseOracleDeploymentConfig {
  identities: AwsHsmOracleIdentity[],
  clusterConfig: AwsClusterConfig
}

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
    console.log('roleName', roleName)
    const roleArn = await createRoleIdempotent(roleName, JSON.stringify(rolePolicy))
    console.log('roleArn', roleArn)
    const policyName = this.awsHsmPolicyName(identity)
    console.log('policyName', policyName)
    const keyArn = await getKeyArnFromAlias(identity.keyAlias, identity.region)
    console.log('keyArn', keyArn)
    const policyArn = await this.createAwsHsmSignPolicyIdempotent(policyName, keyArn)
    console.log('policyArn', policyArn)
    await attachPolicyIdempotent(roleName, policyArn)
    return roleArn
  }

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

  // Note this assumes that the role created by this class is the only
  // attachment of the policy
  async deleteAwsHsmRoleAndPolicyIdempotent(identity: AwsHsmOracleIdentity) {
    const policyArn = await getPolicyArn(this.awsHsmPolicyName(identity))
    const roleName = this.awsHsmRoleName(identity)
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
    return `${identity.keyAlias}-${identity.address}-sign-role`.substring(0, 64)
  }

  awsHsmPolicyName(identity: AwsHsmOracleIdentity) {
    return `${identity.keyAlias}-${identity.address}-sign-policy`
  }

  get deploymentConfig(): AwsHsmOracleDeploymentConfig {
    return this._deploymentConfig as AwsHsmOracleDeploymentConfig
  }
}
