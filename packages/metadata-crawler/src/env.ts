import * as dotenv from 'dotenv'

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
