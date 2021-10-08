import * as dotenv from 'dotenv'
import { isValidAddress, toChecksumAddress } from 'ethereumjs-util'

if (process.env.CONFIG) {
  dotenv.config({ path: process.env.CONFIG })
}

const _fetchEnv = (name: string) => process.env[name] || process.env[name.toLowerCase()]

export function fetchEnv(name: string): string {
  const env = _fetchEnv(name)
  if (!env) {
    console.error(`ENV var '${name}' was not defined`)
    throw new Error(`ENV var '${name}' was not defined`)
  }
  return env as string
}

export function fetchEnvOrDefault(name: string, defaultValue: string): string {
  return _fetchEnv(name) || defaultValue
}

export function isYes(value: string) {
  switch (value.toLowerCase().trim()) {
    case '1':
    case 'y':
    case 'yes':
    case 't':
    case 'true':
      return true
    default:
      return false
  }
}

export function getAttestationSignerAddress() {
  if (
    process.env.ATTESTATION_SIGNER_ADDRESS === undefined ||
    !isValidAddress(process.env.ATTESTATION_SIGNER_ADDRESS)
  ) {
    console.error('Did not specify valid ATTESTATION_SIGNER_ADDRESS')
    throw new Error('Did not specify valid ATTESTATION_SIGNER_ADDRESS')
  }

  return process.env.ATTESTATION_SIGNER_ADDRESS
}

export function getAccountAddress() {
  if (
    process.env.CELO_VALIDATOR_ADDRESS === undefined ||
    !isValidAddress(process.env.CELO_VALIDATOR_ADDRESS)
  ) {
    console.error('Did not specify valid CELO_VALIDATOR_ADDRESS')
    throw new Error('Did not specify valid CELO_VALIDATOR_ADDRESS')
  }

  return toChecksumAddress(process.env.CELO_VALIDATOR_ADDRESS)
}

export function isDevMode() {
  return fetchEnvOrDefault('NODE_ENV', '').toLowerCase() === 'dev'
}

export function getCeloProviders(): string[] {
  const celoProvider = process.env.CELO_PROVIDER
  const celoProviders = process.env.CELO_PROVIDERS
  if ((celoProvider && celoProviders) || (!celoProvider && !celoProviders)) {
    // Intent is unclear, so do not allow this
    throw new Error('Must specify exactly one of: CELO_PROVIDER and CELO_PROVIDERS')
  } else if (celoProvider) {
    // Backwards comaptibility
    return [celoProvider]
  } else {
    return celoProviders!.split(',').filter((t) => t != null && t !== '')
  }
}
