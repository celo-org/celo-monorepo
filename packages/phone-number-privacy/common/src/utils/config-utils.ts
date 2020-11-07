import BigNumber from 'bignumber.js'
import * as dotenv from 'dotenv'

dotenv.config()

export const toNum = (value: BigNumber.Value) => new BigNumber(value).toNumber()
export const toBool = (value: string | undefined, fallback: boolean) =>
  value ? value.toLowerCase() === 'true' : fallback

export function fetchEnv(name: string): string {
  if (process.env[name] === undefined || process.env[name] === '') {
    throw new Error(`ENV var '${name}' was not defined`)
  }
  return process.env[name] as string
}

export function fetchEnvOrDefault(name: string, defaultValue: string): string {
  return process.env[name] === undefined || process.env[name] === ''
    ? defaultValue
    : (process.env[name] as string)
}
