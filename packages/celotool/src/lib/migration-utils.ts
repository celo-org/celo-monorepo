import { envVar, fetchEnv } from './env-utils'
import {
  AccountType,
  generatePrivateKey,
  getAddressesFor,
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
  const faucetAccounts = getAddressesFor(AccountType.FAUCET, mnemonic, 2)
  const attestationBotAccount = getAddressesFor(AccountType.ATTESTATION_BOT, mnemonic, 1)
  return {
    validators: {
      validatorKeys: validatorKeys(),
      attestationKeys: getAttestationKeys(),
    },
    stableToken: {
      initialBalances: {
        addresses: [...faucetAccounts, ...attestationBotAccount],
        values: [
          ...faucetAccounts.map(() => '60000000000000000000000' /* 60k Celo Dollars */),
          ...attestationBotAccount.map(() => '10000000000000000000000' /* 10k Celo Dollars */),
        ],
      },
      oracles: getAddressesFor(AccountType.PRICE_ORACLE, mnemonic, 1),
    },
  }
}

export function truffleOverrides() {
  return {
    from: minerForEnv(),
  }
}
