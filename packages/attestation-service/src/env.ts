import * as dotenv from 'dotenv'
import { isValidAddress, toChecksumAddress } from 'ethereumjs-util'

if (process.env.CONFIG) {
  dotenv.config({ path: process.env.CONFIG })
}

const checkEnv = (name: string) =>
  (process.env[name] === undefined || process.env[name] === '') &&
  (process.env[name.toLowerCase()] === undefined || process.env[name.toLowerCase()] === '')

export function fetchEnv(name: string): string {
  if (checkEnv(name)) {
    console.error(`ENV var '${name}' was not defined`)
    throw new Error(`ENV var '${name}' was not defined`)
  }
  return (process.env[name] || process.env[name.toLowerCase()]) as string
}

export function fetchEnvOrDefault(name: string, defaultValue: string): string {
  return checkEnv(name)
    ? defaultValue
    : ((process.env[name] || process.env[name.toLowerCase()]) as string)
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
