import { readFileSync } from 'fs'
import { addCeloEnvMiddleware, CeloEnvArgv, envVar, fetchEnv } from 'src/lib/env-utils'
import {
  generateIstanbulExtraData,
  getValidatorsInformation,
  Validator,
} from 'src/lib/generate_utils'
import yargs from 'yargs'

export const command = 'istanbul-extra'

export const describe =
  'command to compile the istanbul extra data to include in a custom genesis file'

interface IstanbulExtraArgv extends CeloEnvArgv {
  validators: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(
    argv.option('validators', {
      type: 'string',
      description: 'path to a validators JSON file or the keywod "env"',
      demand: 'Please specify the valdiators to include',
      required: true,
    })
  )
}

export const handler = async (argv: IstanbulExtraArgv) => {
  const validators: Validator[] =
    argv.validators === 'env'
      ? getValidatorsInformation(
          fetchEnv(envVar.MNEMONIC),
          parseInt(fetchEnv(envVar.VALIDATORS), 10)
        )
      : JSON.parse(readFileSync(argv.validators).toString())
  console.info(validators)
  console.info('\nIstanbul extra data:')
  const extra = generateIstanbulExtraData(validators)
  console.info(extra)
}
