import { envVar, fetchEnv } from './env-utils'
import {
  AccountType,
  generatePrivateKey,
  getAddressesFor,
  getPrivateKeysFor,
  privateKeyToAddress,
} from './generate_utils'
import { OG_ACCOUNTS } from './genesis_constants'
import { ensure0x } from './utils'

export function minerForEnv() {
  if (fetchEnv(envVar.VALIDATORS) === 'og') {
    return ensure0x(OG_ACCOUNTS[0].address)
  } else {
    return privateKeyToAddress(
      generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.VALIDATOR, 0)
    )
  }
}

export function validatorKeys() {
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

export function migrationOverrides() {
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  return {
    validators: {
      validatorKeys: validatorKeys(),
    },
    stableToken: {
      initialAccounts: getAddressesFor(AccountType.FAUCET, mnemonic, 2),
      values: getAddressesFor(AccountType.FAUCET, mnemonic, 2).map(() => '60000000000000000000000'), // 60k Celo Dollars
    },
    oracles: getAddressesFor(AccountType.PRICE_ORACLE, mnemonic, 1),
  }
}

export function truffleOverrides() {
  return {
    from: minerForEnv(),
  }
}
