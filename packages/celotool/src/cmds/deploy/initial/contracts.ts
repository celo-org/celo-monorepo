/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import {
  createAttestationServiceURLClaim,
  createNameClaim,
  IdentityMetadataWrapper,
} from '@celo/contractkit/lib/identity'
import { concurrentMap } from '@celo/utils/lib/async'
import { writeFileSync } from 'fs'
import { uploadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import {
  AccountType,
  generatePrivateKey,
  getAddressesFor,
  getPrivateKeysFor,
  privateKeyToAddress,
} from 'src/lib/generate_utils'
import { OG_ACCOUNTS } from 'src/lib/genesis_constants'
import { portForwardAnd } from 'src/lib/port_forward'
import { uploadFileToGoogleStorage } from 'src/lib/testnet-utils'
import { ensure0x, execCmd } from 'src/lib/utils'
import { InitialArgv } from '../../deploy/initial'

export const command = 'contracts'

export const describe = 'deploy the celo smart contracts'

export const builder = {}

export const CLABS_VALIDATOR_METADATA_BUCKET = 'clabs_validator_metadata'

function minerForEnv() {
  if (fetchEnv(envVar.VALIDATORS) === 'og') {
    return ensure0x(OG_ACCOUNTS[0].address)
  } else {
    return privateKeyToAddress(
      generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.VALIDATOR, 0)
    )
  }
}

function getValidatorKeys() {
  if (fetchEnv(envVar.VALIDATORS) === 'og') {
    return OG_ACCOUNTS.map((account) => account.privateKey).map(ensure0x)
  } else {
    return getPrivateKeysFor(
      AccountType.VALIDATOR,
      fetchEnv(envVar.MNEMONIC),
      parseInt(fetchEnv(envVar.VALIDATORS), 10)
    ).map(ensure0x)
  }
}

function getAttestationServiceUrl(testnet: string, index: number) {
  return `https://${testnet}-attestation-service.${fetchEnv(
    envVar.CLUSTER_DOMAIN_NAME
  )}.org/${index}/`
}

function metadataURLForCLabsValidator(testnet: string, address: string) {
  return `https://storage.googleapis.com/${CLABS_VALIDATOR_METADATA_BUCKET}/${testnet}/validator-${testnet}-${address}-metadata.json`
}

async function makeMetadata(testnet: string, address: string, index: number) {
  const attestationServiceClaim = createAttestationServiceURLClaim(
    getAttestationServiceUrl(testnet, index)
  )

  const nameClaim = createNameClaim(`Validator ${index} on ${testnet}: ${address}`)

  const fileName = `validator-${testnet}-${address}-metadata.json`
  const filePath = `/tmp/${fileName}`

  const metadata = new IdentityMetadataWrapper(IdentityMetadataWrapper.emptyData)
  metadata.addClaim(nameClaim)
  metadata.addClaim(attestationServiceClaim)

  writeFileSync(filePath, metadata.toString())

  await uploadFileToGoogleStorage(
    filePath,
    CLABS_VALIDATOR_METADATA_BUCKET,
    `${testnet}/${fileName}`,
    false,
    'application/json'
  )
}

export async function registerMetadata(testnet: string, privateKey: string, index: number) {
  const address = privateKeyToAddress(privateKey)
  await makeMetadata(testnet, address, index)

  const kit = newKit('https://integration-infura.celo-testnet.org')
  kit.addAccount(privateKey)
  kit.defaultAccount = address

  const attestations = await kit.contracts.getAttestations()
  return attestations
    .setMetadataURL(metadataURLForCLabsValidator(testnet, address))
    .sendAndWaitForReceipt()
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()

  console.log(`Deploying smart contracts to ${argv.celoEnv}`)
  const cb = async () => {
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const validatorKeys = getValidatorKeys()
    const migrationOverrides = JSON.stringify({
      validators: {
        validatorKeys,
      },
      stableToken: {
        initialAccounts: getAddressesFor(AccountType.FAUCET, mnemonic, 2),
      },
    })

    const truffleOverrides = JSON.stringify({
      from: minerForEnv(),
    })

    await execCmd(
      `yarn --cwd ../protocol run init-network -n ${
        argv.celoEnv
      } -c '${truffleOverrides}' -m '${migrationOverrides}'`
    )

    console.info('Register Metadata for Clabs validators')
    await concurrentMap(5, validatorKeys, (privateKey, index) =>
      registerMetadata(argv.celoEnv, privateKey, index)
    )
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
    await uploadArtifacts(argv.celoEnv)
  } catch (error) {
    console.error(`Unable to deploy smart contracts to ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
