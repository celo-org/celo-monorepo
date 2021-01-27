/* tslint:disable no-console */
import fs from 'fs'
import path from 'path'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { fetchPassword } from 'src/lib/geth'
import { addCeloGethMiddleware } from 'src/lib/utils'
import yargs from 'yargs'
import { GethArgv } from '../geth'

export const command = 'create-account'

export const describe = 'command for creating account and fauceting it'

interface CreateAccountArgv extends CeloEnvArgv, GethArgv {
  faucet: boolean
  password: string
  passwordFile: string | null
}

export const builder = (argv: yargs.Argv) => {
  return addCeloGethMiddleware(addCeloEnvMiddleware(argv))
    .option('faucet', {
      type: 'boolean',
      alias: 'f',
      default: false,
      description:
        'whether to faucet created account with 100 celo dollars and 10 celo gold or not',
    })
    .option('password', {
      type: 'string',
      description: 'account password',
      default: '',
    })
    .option('password-file', {
      type: 'string',
      description: 'path to file with account password',
      default: null,
    })
}

export const handler = async (argv: CreateAccountArgv) => {
  await switchToClusterFromEnv(false)

  const env = argv.celoEnv
  let password = argv.password
  const datadir = argv.dataDir
  const passwordFile = argv.passwordFile
  const needFaucet = argv.faucet
  const gethBinary = `${argv.gethDir}/build/bin/geth`

  if (!fs.existsSync(path.resolve(datadir, 'keystore'))) {
    console.error(`Error: keystore was not found in datadir ${datadir}`)
    console.info(`Try to running "celotooljs geth init"`)
    process.exit(1)
  }

  if (password.length > 0 && passwordFile !== null) {
    console.error(`Please, specify either "password" or "password-file" but not both`)
    process.exit(1)
  }

  if (passwordFile !== null) {
    password = fetchPassword(passwordFile)
  }

  const passwordFilePath = path.resolve(__dirname, '__password_tmp')
  fs.writeFileSync(passwordFilePath, password)

  const [stdout, stderr] = await execCmd(
    `${gethBinary} --datadir=${datadir} account new --password ${passwordFilePath}`
  )

  fs.unlinkSync(passwordFilePath)

  const addressRegex = /Address:.*{([a-zA-Z0-9]+)}/
  const matches = addressRegex.exec(stdout)
  if (matches && matches.length === 2) {
    const address = matches[1]
    console.info(`Created account address: 0x${address}`)

    if (needFaucet) {
      console.log(`Fauceting 0x${address} on ${env}`)
      await execCmdWithExitOnFailure(
        `yarn --cwd ${process.cwd()} run cli account faucet -e ${env} --account 0x${address}`
      )
      console.info(`Fauceting completed successfully! 💰💰💰`)
    }
  } else {
    console.error('Error occured while creating account')
    console.error(`stderr: ${stderr}`)
  }
}
