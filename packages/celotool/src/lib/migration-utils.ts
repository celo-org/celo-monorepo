import { envVar, fetchEnv, fetchEnvOrFallback } from './env-utils'
import {
  AccountType,
  generatePrivateKey,
  getAddressesFor,
  getFaucetedAccounts,
  getPrivateKeysFor,
  privateKeyToAddress,
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

function getAttestationKeys() {
  return getPrivateKeysFor(
    AccountType.ATTESTATION,
    fetchEnv(envVar.MNEMONIC),
    parseInt(fetchEnv(envVar.VALIDATORS), 10)
  ).map(ensure0x)
}

export function migrationOverrides() {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const faucetedAccountAddresses = getFaucetedAccounts(mnemonic).map((account) => account.address)
  const attestationBotAddresses = getAddressesFor(AccountType.ATTESTATION_BOT, mnemonic, 10)
  const initialAddresses = [...faucetedAccountAddresses, ...attestationBotAddresses]

  const initialBalance = fetchEnvOrFallback(envVar.FAUCET_CUSD_WEI, DEFAULT_FAUCET_CUSD_WEI)
  const epoch = parseInt(fetchEnvOrFallback(envVar.EPOCH, '30000'), 10)

  return {
    stableToken: {
      initialBalances: {
        addresses: initialAddresses,
        values: initialAddresses.map(() => initialBalance),
      },
      oracles: [...getAddressesFor(AccountType.PRICE_ORACLE, mnemonic, 1), minerForEnv()],
    },
    validators: {
      validatorKeys: validatorKeys(),
      attestationKeys: getAttestationKeys(),
      commissionUpdateDelay: epoch, // at least an epoch
    },
  }
}

export function truffleOverrides() {
  return {
    from: minerForEnv(),
  }
}
