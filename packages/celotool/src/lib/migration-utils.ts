import { envVar, fetchEnv } from './env-utils'
import {
  AccountType,
  generatePrivateKey,
  getAddressesFor,
  getFaucetedAccounts,
  getPrivateKeysFor,
  privateKeyToAddress,
} from './generate_utils'
import { ensure0x } from './utils'

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
  const faucetedAccounts = getFaucetedAccounts(mnemonic)
  return {
    validators: {
      validatorKeys: validatorKeys(),
      attestationKeys: getAttestationKeys(),
    },
    stableToken: {
      initialAccounts: faucetedAccounts.map((account) => account.address),
      values: faucetedAccounts.map(() => '60000000000000000000000'), // 60k Celo Dollars
      oracles: getAddressesFor(AccountType.PRICE_ORACLE, mnemonic, 1),
    },
  }
}

export function truffleOverrides() {
  return {
    from: minerForEnv(),
  }
}
