/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { createAttestationServiceURLClaim } from '@celo/contractkit/lib/identity/claims/attestation-service-url'
import { createNameClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { concurrentMap } from '@celo/utils/lib/async'
import { LocalSigner } from '@celo/utils/lib/signatureUtils'
import { writeFileSync } from 'fs'
import { uploadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { privateKeyToAddress } from 'src/lib/generate_utils'
import { migrationOverrides, truffleOverrides, validatorKeys } from 'src/lib/migration-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import { uploadFileToGoogleStorage } from 'src/lib/testnet-utils'
import { InitialArgv } from '../../deploy/initial'

export const command = 'contracts'

export const describe = 'deploy the celo smart contracts'

export const builder = {}

export const CLABS_VALIDATOR_METADATA_BUCKET = 'clabs_validator_metadata'

function getAttestationServiceUrl(testnet: string, index: number) {
  return `https://${testnet}-attestation-service.${fetchEnv(
    envVar.CLUSTER_DOMAIN_NAME
  )}.org/${index}/`
}

function metadataURLForCLabsValidator(testnet: string, address: string) {
  return `https://storage.googleapis.com/${CLABS_VALIDATOR_METADATA_BUCKET}/${testnet}/validator-${testnet}-${address}-metadata.json`
}

async function makeMetadata(testnet: string, address: string, index: number, privateKey: string) {
  const attestationServiceClaim = createAttestationServiceURLClaim(
    getAttestationServiceUrl(testnet, index)
  )

  const nameClaim = createNameClaim(`Validator ${index} on ${testnet}: ${address}`)

  const fileName = `validator-${testnet}-${address}-metadata.json`
  const filePath = `/tmp/${fileName}`

  const metadata = IdentityMetadataWrapper.fromEmpty(address)
  await metadata.addClaim(nameClaim, LocalSigner(privateKey))
  await metadata.addClaim(attestationServiceClaim, LocalSigner(privateKey))
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
  await makeMetadata(testnet, address, index, privateKey)

  const kit = newKit('http://localhost:8545')
  kit.addAccount(privateKey)
  kit.defaultAccount = address

  const accounts = await kit.contracts.getAccounts()
  return accounts
    .setMetadataURL(metadataURLForCLabsValidator(testnet, address))
    .sendAndWaitForReceipt()
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()

  console.log(`Deploying smart contracts to ${argv.celoEnv}`)
  const cb = async () => {
    await execCmd(
      `yarn --cwd ../protocol run init-network -n ${argv.celoEnv} -c '${JSON.stringify(
        truffleOverrides()
      )}' -m '${JSON.stringify(migrationOverrides())}'`
    )

    console.info('Register Metadata for Clabs validators')
    await concurrentMap(5, validatorKeys(), (privateKey, index) =>
      registerMetadata(argv.celoEnv, privateKey, index)
    )
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
    await uploadArtifacts(argv.celoEnv)
    return
  } catch (error) {
    console.error(`Unable to deploy smart contracts to ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
