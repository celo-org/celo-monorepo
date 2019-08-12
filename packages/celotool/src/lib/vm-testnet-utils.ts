import {
  AccountType,
  generatePrivateKey,
  privateKeyToAddress,
  privateKeyToPublicKey,
} from '@celo/celotool/src/lib/generate_utils'
import { uploadFileToGoogleStorage } from '@celo/celotool/src/lib/testnet-utils'
import { envVar, fetchEnv } from '@celo/celotool/src/lib/utils'
import { writeFileSync } from 'fs'

const secretsBucketName = 'celo-testnet-secrets'

// TODO(trevor): update this to include tx-nodes when they are added to
// the terraform module
export async function generateAndUploadSecrets(celoEnv: string) {
  const validatorCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  for (let i = 0; i < validatorCount; i++) {
    const secrets = generateSecretsEnvVars(AccountType.VALIDATOR, i)
    const localTmpFilePath = `/tmp/${celoEnv}-validator-${i}-secrets`
    writeFileSync(localTmpFilePath, secrets)
    const cloudStorageFileName = `vm/${celoEnv}/.env.validator-${i}`
    await uploadFileToGoogleStorage(
      localTmpFilePath,
      secretsBucketName,
      cloudStorageFileName,
      false
    )
  }
}

export function generateSecretsEnvVars(accountType: AccountType, index: number) {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const privateKey = generatePrivateKey(mnemonic, accountType, index)
  const secrets = {
    ACCOUNT_ADDRESS: privateKeyToAddress(privateKey),
    BOOTNODE_ENODE_ADDRESS: privateKeyToPublicKey(
      generatePrivateKey(mnemonic, AccountType.BOOTNODE, 0)
    ),
    PRIVATE_KEY: privateKey,
    [envVar.GETH_ACCOUNT_SECRET]: fetchEnv(envVar.GETH_ACCOUNT_SECRET),
    [envVar.ETHSTATS_WEBSOCKETSECRET]: fetchEnv(envVar.ETHSTATS_WEBSOCKETSECRET),
    [envVar.MNEMONIC]: mnemonic,
  }
  return formatEnvVars(secrets)
}

// Formats an object into a multi-line string with each line formatted KEY=VALUE
function formatEnvVars(envVars: { [key: string]: string | number | boolean }) {
  return Object.keys(envVars)
    .map((key) => `${key}=${envVars[key]}`)
    .join('\n')
}
