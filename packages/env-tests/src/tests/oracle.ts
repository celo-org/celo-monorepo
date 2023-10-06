import { EnvTestContext } from '../context'

export function runOracleTest(context: EnvTestContext) {
  console.info(context)
  throw new Error('ENV RESERVE ARE CURRENTLY DISABLED')
}
