import { StableToken } from '@celo/contractkit'
import { EnvTestContext } from '../context'

export function runTransfersTest(context: EnvTestContext, stableTokensToTest: StableToken[]) {
  console.info(context, stableTokensToTest)
  throw new Error('ENV TRANSFER ARE CURRENTLY DISABLED')
}
