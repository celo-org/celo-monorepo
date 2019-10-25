import {
  AccountType,
  generatePrivateKey,
  getAddressesFor,
  getPrivateKeysFor,
  privateKeyToAddress,
} from './generate_utils'
import { ensure0x } from './utils'
import { OG_ACCOUNTS } from './genesis_constants'
import { envVar, fetchEnv } from './env-utils'

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
  return {
    validators: {
      validatorKeys: validatorKeys(),
    },
    stableToken: {
      initialAccounts: getAddressesFor(AccountType.FAUCET, fetchEnv(envVar.MNEMONIC), 2),
    },
  }
}

export function truffleOverrides() {
  return {
    from: minerForEnv(),
  }
}
