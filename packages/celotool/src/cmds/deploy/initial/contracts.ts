/* tslint:disable no-console */
import { uploadArtifacts } from 'src/lib/artifacts'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import {
  AccountType,
  generatePrivateKey,
  getPrivateKeysFor,
  privateKeyToAddress,
} from 'src/lib/generate_utils'
import { OG_ACCOUNTS } from 'src/lib/genesis_constants'
import { portForwardAnd } from 'src/lib/port_forward'
import { ensure0x, execCmd } from 'src/lib/utils'
import { InitialArgv } from '../../deploy/initial'

export const command = 'contracts'

export const describe = 'deploy the celo smart contracts'

export const builder = {}

function minerForEnv() {
  if (fetchEnv(envVar.VALIDATORS) === 'og') {
    return ensure0x(OG_ACCOUNTS[0].address)
  } else {
    return privateKeyToAddress(
      generatePrivateKey(fetchEnv(envVar.MNEMONIC), AccountType.VALIDATOR, 0)
    )
  }
}

function getValidatorKeys() {
  if (fetchEnv(envVar.VALIDATORS) === 'og') {
    return OG_ACCOUNTS.map((account) => account.privateKey).map(ensure0x)
  } else {
    return getPrivateKeysFor(
      AccountType.VALIDATOR,
      fetchEnv(envVar.MNEMONIC),
      parseInt(fetchEnv(envVar.VALIDATORS), 10)
    ).map(ensure0x)
  }
}

export const handler = async (argv: InitialArgv) => {
  await switchToClusterFromEnv()

  console.log(`Deploying smart contracts to ${argv.celoEnv}`)
  const cb = async () => {
    const migrationOverrides = {
      validators: {
        validatorKeys: getValidatorKeys(),
      },
    }
    const truffleOverrides = {
      from: minerForEnv(),
    }

    await execCmd(
      `yarn --cwd ../protocol run init-network -n ${argv.celoEnv} -c '${JSON.stringify(
        truffleOverrides
      )}' -m '${JSON.stringify(migrationOverrides)}'`
    )
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
    await uploadArtifacts(argv.celoEnv)
  } catch (error) {
    console.error(`Unable to deploy smart contracts to ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
