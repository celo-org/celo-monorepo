import { ensureLeading0x } from '@celo/utils/lib/address'
import { DynamicEnvVar, envVar, fetchEnv } from 'src/lib/env-utils'
import yargs from 'yargs'
import { getCloudProviderFromContext, getDynamicEnvVarValues } from './context-utils'
import { getOraclePrivateKeysFor, privateKeyToAddress } from './generate_utils'
import { AksClusterConfig } from './k8s-cluster/aks'
import { BaseClusterManager, CloudProvider } from './k8s-cluster/base'
import {
  AksHsmOracleDeployer,
  AksHsmOracleDeploymentConfig,
  AksHsmOracleIdentity,
} from './k8s-oracle/aks-hsm'
import { BaseOracleDeployer, CurrencyPair } from './k8s-oracle/base'
import {
  PrivateKeyOracleDeployer,
  PrivateKeyOracleDeploymentConfig,
  PrivateKeyOracleIdentity,
} from './k8s-oracle/pkey'

/**
 * Maps each cloud provider to the correct function to get the appropriate
 * HSM-based oracle deployer.
 */
const hsmOracleDeployerGetterByCloudProvider: {
  [key in CloudProvider]?: (
    celoEnv: string,
    context: string,
    currencyPair: CurrencyPair,
    useForno: boolean,
    clusterManager: BaseClusterManager
  ) => BaseOracleDeployer
} = {
  [CloudProvider.AZURE]: getAksHsmOracleDeployer,
}

/**
 * Gets the appropriate oracle deployer for the given context. If the env vars
 * specify that the oracle addresses should be generated from the mnemonic,
 * then the cloud-provider agnostic deployer PrivateKeyOracleDeployer is used.
 */
export function getOracleDeployerForContext(
  celoEnv: string,
  context: string,
  currencyPair: CurrencyPair,
  useForno: boolean,
  clusterManager: BaseClusterManager
) {
  // If the mnemonic-based oracle address env var has a value, we should be using
  // the private key oracle deployer
  const { addressesFromMnemonicCount } = getDynamicEnvVarValues(
    mnemonicBasedOracleIdentityConfigDynamicEnvVars,
    { context, currencyPair },
    {
      addressesFromMnemonicCount: '',
    }
  )

  if (addressesFromMnemonicCount) {
    const addressesFromMnemonicCountNum = parseInt(addressesFromMnemonicCount, 10)
    // This is a cloud-provider agnostic deployer because it doesn't rely
    // on cloud-specific HSMs
    return getPrivateKeyOracleDeployer(
      celoEnv,
      context,
      currencyPair,
      useForno,
      addressesFromMnemonicCountNum
    )
  }
  // If we've gotten this far, we should be using an HSM-based oracle deployer
  const cloudProvider: CloudProvider = getCloudProviderFromContext(context)
  const getDeployer = hsmOracleDeployerGetterByCloudProvider[cloudProvider]
  if (getDeployer === undefined) {
    throw new Error(
      `Deployer not defined for CloudProvider: ${cloudProvider}. ` +
        `Expecting one of: ${Object.keys(hsmOracleDeployerGetterByCloudProvider)}`
    )
  }
  return getDeployer(celoEnv, context, currencyPair, useForno, clusterManager)
}

/**
 * ----------- AksHsmOracleDeployer helpers -----------
 */

/**
 * Gets an AksHsmOracleDeployer by looking at env var values
 */
function getAksHsmOracleDeployer(
  celoEnv: string,
  context: string,
  currencyPair: CurrencyPair,
  useForno: boolean,
  clusterManager: BaseClusterManager
) {
  const { addressKeyVaults } = getDynamicEnvVarValues(
    aksHsmOracleIdentityConfigDynamicEnvVars,
    { context, currencyPair },
    {
      addressKeyVaults: '',
    }
  )
  const aksClusterConfig = clusterManager.clusterConfig as AksClusterConfig
  const identities = getAksHsmOracleIdentities(
    addressKeyVaults,
    aksClusterConfig.resourceGroup,
    currencyPair
  )
  const deploymentConfig: AksHsmOracleDeploymentConfig = {
    context,
    clusterConfig: aksClusterConfig,
    currencyPair,
    identities,
    useForno,
  }
  return new AksHsmOracleDeployer(deploymentConfig, celoEnv)
}

/**
 * Given a string addressAzureKeyVaults containing comma separated info of the form:
 * <address>:<keyVaultName>:<resourceGroup (optional)>
 * eg: 0x0000000000000000000000000000000000000000:keyVault0,0x0000000000000000000000000000000000000001:keyVault1:resourceGroup1
 * returns an array of AksHsmOracleIdentity in the same order
 */
export function getAksHsmOracleIdentities(
  addressAzureKeyVaults: string,
  defaultResourceGroup: string,
  currencyPair: CurrencyPair
): AksHsmOracleIdentity[] {
  const identityStrings = addressAzureKeyVaults.split(',')
  const identities = []
  for (const identityStr of identityStrings) {
    const [address, keyVaultName, resourceGroup] = identityStr.split(':')
    // resourceGroup can be undefined
    if (!address || !keyVaultName) {
      throw Error(
        `Address or key vault name is invalid. Address: ${address} Key Vault Name: ${keyVaultName}`
      )
    }
    identities.push({
      address,
      currencyPair,
      keyVaultName,
      resourceGroup: resourceGroup || defaultResourceGroup,
    })
  }
  return identities
}

/**
 * Config values pulled from env vars used for generating an AksHsmOracleIdentity
 */
interface AksHsmOracleIdentityConfig {
  addressKeyVaults: string
}

/**
 * Env vars corresponding to each value for the AksHsmOracleIdentityConfig for a particular context
 */
const aksHsmOracleIdentityConfigDynamicEnvVars: {
  [k in keyof AksHsmOracleIdentityConfig]: DynamicEnvVar
} = {
  addressKeyVaults: DynamicEnvVar.ORACLE_ADDRESS_AZURE_KEY_VAULTS,
}

/**
 * ----------- PrivateKeyOracleDeployer helpers -----------
 */

/**
 * Gets an PrivateKeyOracleDeployer by looking at env var values and generating private keys
 * from the mnemonic
 */
function getPrivateKeyOracleDeployer(
  celoEnv: string,
  context: string,
  currencyPair: CurrencyPair,
  useForno: boolean,
  count: number
): PrivateKeyOracleDeployer {
  const identities: PrivateKeyOracleIdentity[] = getOraclePrivateKeysFor(
    currencyPair,
    fetchEnv(envVar.MNEMONIC),
    count
  ).map((pkey) => ({
    address: privateKeyToAddress(pkey),
    currencyPair,
    privateKey: ensureLeading0x(pkey),
  }))
  const deploymentConfig: PrivateKeyOracleDeploymentConfig = {
    context,
    currencyPair,
    identities,
    useForno,
  }
  return new PrivateKeyOracleDeployer(deploymentConfig, celoEnv)
}

/**
 * Config values pulled from env vars used for generating a PrivateKeyOracleIdentity
 * from a mnemonic
 */
interface MnemonicBasedOracleIdentityConfig {
  addressesFromMnemonicCount: string
}

/**
 * Env vars corresponding to each value for the MnemonicBasedOracleIdentityConfig for a particular context
 */
const mnemonicBasedOracleIdentityConfigDynamicEnvVars: {
  [k in keyof MnemonicBasedOracleIdentityConfig]: DynamicEnvVar
} = {
  addressesFromMnemonicCount: DynamicEnvVar.ORACLE_ADDRESSES_FROM_MNEMONIC_COUNT,
}

/**
 * Add currencyPair to command arguments
 * @param argv the yargs arguments list to add to
 */
export function addCurrencyPairMiddleware(argv: yargs.Argv) {
  return argv.option('currencyPair', {
    choices: [
      'CELOUSD',
      'CELOEUR',
      'CELOBRL',
      'USDCUSD',
      'USDCEUR',
      'USDCBRL',
      'CELOXOF',
      'XOFEUR',
      'EUROCEUR',
      'EURXOF',
      'EUROCXOF',
    ],
    description: 'Oracle deployment to target based on currency pair',
    demandOption: true,
    type: 'string',
  })
}

/**
 * Add useForno to command arguments
 * @param argv the yargs arguments list to add to
 */
export function addUseFornoMiddleware(argv: yargs.Argv) {
  return argv.option('useForno', {
    description: 'Uses forno for RPCs from the oracle clients',
    default: false,
    type: 'boolean',
  })
}
