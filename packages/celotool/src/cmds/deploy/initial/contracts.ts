/* tslint:disable no-console */
import { ContractKit, IdentityMetadataWrapper, newKitFromWeb3 } from '@celo/contractkit'
import { createNameClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { concurrentMap } from '@celo/utils/lib/async'
import { LocalSigner } from '@celo/utils/lib/signatureUtils'
import { writeFileSync } from 'fs'
import { uploadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd } from 'src/lib/cmd-utils'
import { privateKeyToAddress } from 'src/lib/generate_utils'
import { exitIfCelotoolHelmDryRun } from 'src/lib/helm_deploy'
import { migrationOverrides, truffleOverrides, validatorKeys } from 'src/lib/migration-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import { uploadFileToGoogleStorage } from 'src/lib/testnet-utils'
import Web3 from 'web3'
import yargs from 'yargs'
import { InitialArgv } from '../../deploy/initial'

export const command = 'contracts'

export const describe = 'deploy the celo smart contracts'

type ContractsArgv = InitialArgv & {
  skipFaucetting: boolean
}

export const builder = (argv: yargs.Argv) => {
  return argv.option('skipFaucetting', {
    describe: 'skips allocation of cUSD to any oracle or bot accounts',
    default: false,
    type: 'boolean',
  })
}

export const CLABS_VALIDATOR_METADATA_BUCKET = 'clabs_validator_metadata'

function metadataURLForCLabsValidator(testnet: string, address: string) {
  return `https://storage.googleapis.com/${CLABS_VALIDATOR_METADATA_BUCKET}/${testnet}/validator-${testnet}-${address}-metadata.json`
}

async function makeMetadata(testnet: string, address: string, index: number, privateKey: string) {
  const nameClaim = createNameClaim(`Validator ${index} on ${testnet}: ${address}`)

  const fileName = `validator-${testnet}-${address}-metadata.json`
  const filePath = `/tmp/${fileName}`

  const metadata = IdentityMetadataWrapper.fromEmpty(address)
  await metadata.addClaim(nameClaim, LocalSigner(privateKey))
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

  const web3: Web3 = new Web3('http://localhost:8545')
  const kit: ContractKit = newKitFromWeb3(web3)
  kit.connection.addAccount(privateKey)
  kit.connection.defaultAccount = address

  const accounts = await kit.contracts.getAccounts()
  return accounts
    .setMetadataURL(metadataURLForCLabsValidator(testnet, address))
    .sendAndWaitForReceipt()
}

export const handler = async (argv: ContractsArgv) => {
  exitIfCelotoolHelmDryRun()
  await switchToClusterFromEnv(argv.celoEnv)

  console.info(`Deploying smart contracts to ${argv.celoEnv}`)
  const cb = async () => {
    await execCmd(
      `yarn --cwd ../protocol run init-network -n ${argv.celoEnv} -c '${JSON.stringify(
        truffleOverrides()
      )}' -m '${JSON.stringify(await migrationOverrides(!argv.skipFaucetting))}'`
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
