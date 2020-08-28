import { ContractKit, newKit } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { eqAddress } from '@celo/utils/lib/address'
import 'cross-fetch/polyfill'
import { FindOptions, Sequelize } from 'sequelize'
import { fetchEnv, getAccountAddress, getAttestationSignerAddress } from './env'
import { rootLogger } from './logger'
import Attestation, { AttestationModel, AttestationStatic } from './models/attestation'

export let sequelize: Sequelize | undefined

export function initializeDB() {
  if (sequelize === undefined) {
    sequelize = new Sequelize(fetchEnv('DATABASE_URL'), {
      logging: (msg: string, sequelizeLogArgs: any) =>
        rootLogger.debug({ sequelizeLogArgs, component: 'sequelize' }, msg),
    })
    rootLogger.info('Initializing Database')
    return sequelize.authenticate() as Promise<void>
  }
  return Promise.resolve()
}

export function isDBOnline() {
  if (sequelize === undefined) {
    return initializeDB()
  } else {
    return sequelize.authenticate() as Promise<void>
  }
}

export let kit: ContractKit

export async function isNodeSyncing() {
  const syncProgress = await kit.web3.eth.isSyncing()
  return typeof syncProgress === 'boolean' && syncProgress
}

export async function getAgeOfLatestBlock() {
  const latestBlock = await kit.web3.eth.getBlock('latest')
  const ageOfLatestBlock = Date.now() / 1000 - Number(latestBlock.timestamp)
  return {
    ageOfLatestBlock,
    number: latestBlock.number,
  }
}

export async function isAttestationSignerUnlocked() {
  // The only way to see if a key is unlocked is to try to sign something
  try {
    await kit.web3.eth.sign('DO_NOT_USE', getAttestationSignerAddress())
    return true
  } catch {
    return false
  }
}

// Verify a signer and validator address are provided, are valid, match the on-chain signer,
// that signer account is unlocked, that metadata is accessible and valid and that the
// attestationServiceURL claim is present in the metadata (external name/port may be
// different to instance, so we cannot validate its details)
export async function verifyConfigurationAndGetURL() {
  const signer = getAttestationSignerAddress()
  const validator = getAccountAddress()

  const accounts = await kit.contracts.getAccounts()
  if (!(await accounts.isAccount(validator))) {
    throw Error(`${validator} is not registered as an account!`)
  }

  if (!(await accounts.hasAuthorizedAttestationSigner(validator))) {
    throw Error(`No attestation signer authorized for ${validator}!`)
  }

  const signerOnChain = await accounts.getAttestationSigner(validator)
  if (!eqAddress(signerOnChain, signer)) {
    throw Error(
      `Different attestation signer in config ${signer} than on-chain ${signerOnChain} for ${validator}!`
    )
  }

  if (!(await isAttestationSignerUnlocked())) {
    throw Error(`Need to unlock attestation signer account ${signer}`)
  }

  const metadataURL = await accounts.getMetadataURL(validator)
  try {
    const metadata = await IdentityMetadataWrapper.fetchFromURL(kit, metadataURL)
    const claim = metadata.findClaim(ClaimTypes.ATTESTATION_SERVICE_URL)
    if (!claim) {
      throw Error('Missing ATTESTATION_SERVICE_URL claim')
    }
    return claim.url
  } catch (error) {
    throw Error(`Could not verify metadata at ${metadataURL}: ${error}`)
  }
}

export async function initializeKit() {
  if (kit === undefined) {
    kit = newKit(fetchEnv('CELO_PROVIDER'))
    // Copied from @celo/cli/src/utils/helpers
    try {
      const { ageOfLatestBlock } = await getAgeOfLatestBlock()
      rootLogger.info({ ageOfLatestBlock }, 'Initializing ContractKit')
    } catch (error) {
      rootLogger.error(
        'Initializing ContractKit failed. Is the Celo node running and accessible via ' +
          `the "CELO_PROVIDER" env var? Currently set as ${fetchEnv('CELO_PROVIDER')}`
      )
      throw error
    }
  }
}

let AttestationTable: AttestationStatic

export async function getAttestationTable() {
  if (AttestationTable) {
    return AttestationTable
  }
  AttestationTable = await Attestation(sequelize!)
  return AttestationTable
}

export async function existingAttestationRequestRecord(
  identifier: string,
  account: string,
  issuer: string,
  options: FindOptions = {}
): Promise<AttestationModel | null> {
  return (await getAttestationTable()).findOne({
    where: { identifier, account, issuer },
    ...options,
  })
}
