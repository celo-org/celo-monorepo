import { CeloEnvArgv } from 'src/lib/env-utils'
import { getValidatorAddressFromEnv } from 'src/lib/generate_utils'
import * as yargs from 'yargs'

export const command = 'faucet-address'

export const describe =
  'command for fetching the validator addresses specified by the current environment'

interface AccountAddressArgv {
  validatorNumber: number
}

type ValidatorAddressArgv = CeloEnvArgv & AccountAddressArgv

export const builder = (argv: yargs.Argv) => {
  return argv.option('-number', {
    type: 'number',
    description: 'validator number',
    demand: 'Please specifiy a validator number',
  })
}

export const handler = async (_argv: ValidatorAddressArgv) => {
  const validatorAddress = getValidatorAddressFromEnv(_argv.validatorNumber)
  console.info(validatorAddress)
}
