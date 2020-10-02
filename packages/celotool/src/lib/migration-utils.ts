/* tslint:disable:no-console */
// import { config } from '@celo/protocol/migrationsConfig'
import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import {
  AccountType,
  generatePrivateKey,
  getAddressesFor,
  getFaucetedAccounts,
  getPrivateKeysFor,
  privateKeyToAddress
} from './generate_utils'
import { ensure0x } from './utils'

const DEFAULT_FAUCET_CUSD_WEI = '60000000000000000000000' /* 60k Celo Dollars */

export function minerForEnv() {
  return privateKeyToAddress(
    generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.VALIDATOR, 0)
  )
}

export function validatorKeys() {
  return getPrivateKeysFor(
    AccountType.VALIDATOR,
    fetchEnv(envVar.MNEMONIC),
    parseInt(fetchEnv(envVar.VALIDATORS), 10)
  ).map(ensure0x)
}

export function validatorGroupKeys() {
  const validatorCount = parseInt(fetchEnv(envVar.VALIDATORS), 10)
  // const maxGroupSize = config.validators.maxGroupSize
  const maxGroupSize = 5 // TODO
  const validatorGroupCountFloor = Math.floor(validatorCount/maxGroupSize)
  const validatorGroupCount = validatorCount % maxGroupSize === 0 ? validatorGroupCountFloor : validatorGroupCountFloor + 1
  return getPrivateKeysFor(
    AccountType.VALIDATOR_GROUP,
    fetchEnv(envVar.MNEMONIC),
    validatorGroupCount
  ).map(ensure0x)
}

function getAttestationKeys() {
  return getPrivateKeysFor(
    AccountType.ATTESTATION,
    fetchEnv(envVar.MNEMONIC),
    parseInt(fetchEnv(envVar.VALIDATORS), 10)
  ).map(ensure0x)
}

export function migrationOverrides(faucet: boolean) {
  let overrides = {}
  if (faucet) {
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const faucetedAccountAddresses = getFaucetedAccounts(mnemonic).map((account) => account.address)
    const attestationBotAddresses = getAddressesFor(AccountType.ATTESTATION_BOT, mnemonic, 10)
    const initialAddresses = [...faucetedAccountAddresses, ...attestationBotAddresses]

    const initialBalance = fetchEnvOrFallback(envVar.FAUCET_CUSD_WEI, DEFAULT_FAUCET_CUSD_WEI)

    overrides = {
      ...overrides,
      stableToken: {
        initialBalances: {
          addresses: initialAddresses,
          values: initialAddresses.map(() => initialBalance),
        },
        oracles: [...getAddressesFor(AccountType.PRICE_ORACLE, mnemonic, 1), minerForEnv()],
      }
    }
  }

  return {
    ...overrides,
    validators: {
      validatorKeys: validatorKeys(),
      validatorGroupKeys: validatorGroupKeys(),
      attestationKeys: getAttestationKeys(),
    },
  }
}

export function truffleOverrides() {
  return {
    from: minerForEnv(),
  }
}
