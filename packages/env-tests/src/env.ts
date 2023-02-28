import * as dotenv from 'dotenv'
import { existsSync } from 'fs'
import path from 'path'

if (process.env.CONFIG) {
  dotenv.config({ path: process.env.CONFIG })
}

export function fetchEnv(name: string): string {
  if (process.env[name] === undefined || process.env[name] === '') {
    console.error(`ENV var '${name}' was not defined`)
    throw new Error(`ENV var '${name}' was not defined`)
  }
  return process.env[name] as string
}

export function fetchEnvOrDefault(name: string, defaultValue: string): string {
  return process.env[name] === undefined || process.env[name] === ''
    ? defaultValue
    : (process.env[name] as string)
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

// Only use this if in monorepo and env files are as expected and in dev
export function loadFromEnvFile() {
  const envName = process.env.CELO_ENV

  if (!envName) {
    return
  }

  const envFile = getEnvFile(envName)
  dotenv.config({ path: envFile })

  const envFileMnemonic = getEnvFile(envName, '.mnemonic')
  dotenv.config({ path: envFileMnemonic })

  return envName
}

export const monorepoRoot = path.resolve(process.cwd(), './../..')
export const genericEnvFilePath = path.resolve(monorepoRoot, '.env')

export function getEnvFile(celoEnv: string, envBegining: string = '') {
  const filePath: string = path.resolve(monorepoRoot, `.env${envBegining}.${celoEnv}`)
  if (existsSync(filePath)) {
    return filePath
  } else {
    return `${genericEnvFilePath}${envBegining}`
  }
}
