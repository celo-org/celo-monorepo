import { generateKeys } from '@celo/cryptographic-utils/lib/account'
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

export async function getKey(mnemonic: string, account: TestAccounts) {
  const key = await generateKeys(mnemonic, undefined, 0, account)
  return { ...key, address: privateKeyToAddress(key.privateKey) }
}

// From env-tests package
export enum TestAccounts {
  Root,
  TransferFrom,
  TransferTo,
  Exchange,
  Oracle,
  GovernanceApprover,
  ReserveSpender,
  ReserveCustodian,
}

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

export async function migrationOverrides(faucet: boolean) {
  let overrides = {}
  if (faucet) {
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const faucetedAccountAddresses = getFaucetedAccounts(mnemonic).map((account) => account.address)
    const attestationBotAddresses = getAddressesFor(AccountType.ATTESTATION_BOT, mnemonic, 10)
    const validatorAddresses = getAddressesFor(AccountType.VALIDATOR, mnemonic, 1)
    const envTestRoot = await getKey(mnemonic, TestAccounts.Root)
    const envTestReserveCustodian = await getKey(mnemonic, TestAccounts.ReserveCustodian)
    const envTestOracle = await getKey(mnemonic, TestAccounts.Oracle)
    const envTestGovernanceApprover = await getKey(mnemonic, TestAccounts.GovernanceApprover)
    const envTestReserveSpender = await getKey(mnemonic, TestAccounts.ReserveSpender)
    const initialAddresses = [
      ...faucetedAccountAddresses,
      ...attestationBotAddresses,
      ...validatorAddresses,
      envTestRoot.address,
      envTestOracle.address,
    ]

    const initialBalance = fetchEnvOrFallback(envVar.FAUCET_CUSD_WEI, DEFAULT_FAUCET_CUSD_WEI)

    overrides = {
      ...overrides,
      stableToken: {
        initialBalances: {
          addresses: initialAddresses,
          values: initialAddresses.map(() => initialBalance),
        },
        oracles: [
          ...getAddressesFor(AccountType.PRICE_ORACLE, mnemonic, 1),
          minerForEnv(),
          envTestOracle.address,
        ],
      },
      // from migrationsConfig
      governanceApproverMultiSig: {
        signatories: [minerForEnv(), envTestGovernanceApprover.address],
        numRequiredConfirmations: 1,
        numInternalRequiredConfirmations: 1,
      },
      // from migrationsConfig:
      reserve: {
        initialBalance: 100000000, // CELO
        frozenAssetsStartBalance: 80000000, // Matches Mainnet after CGP-6
        frozenAssetsDays: 182, // 3x Mainnet thawing rate
        otherAddresses: [envTestReserveCustodian.address],
      },
      // from migrationsConfig
      reserveSpenderMultiSig: {
        signatories: [minerForEnv(), envTestReserveSpender.address],
        numRequiredConfirmations: 1,
        numInternalRequiredConfirmations: 1,
      },
    }
  }

  return {
    ...overrides,
    validators: {
      validatorKeys: validatorKeys(),
      attestationKeys: getAttestationKeys(),
    },
  }
}

export function truffleOverrides() {
  return {
    from: minerForEnv(),
  }
}
