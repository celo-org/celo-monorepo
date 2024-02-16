/* tslint:disable no-console */
import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { CeloEnvArgv, addCeloEnvMiddleware } from 'src/lib/env-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import Web3 from 'web3'
import yargs from 'yargs'

export const command = 'unfreeze-contracts'

export const describe = 'command for unfreezing epoch rewards'

interface UnfreezeContractsArgv extends CeloEnvArgv {
  rewards: boolean
  freeze: boolean
  precheck: boolean
  verify: boolean
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('rewards', {
      type: 'boolean',
      description: 'Affect epoch rewards',
      default: true,
    })
    .option('freeze', {
      type: 'boolean',
      description: 'Freeze contracts instead of unfreezing',
      default: false,
    })
    .option('precheck', {
      type: 'boolean',
      description: 'Check the contract freeze status before continuing',
      default: true,
    })
    .option('verify', {
      type: 'boolean',
      description: 'Verify the contract freeze status after',
      default: true,
    })
}

export const handler = async (argv: UnfreezeContractsArgv) => {
  await switchToClusterFromEnv(argv.celoEnv)

  const cb = async () => {
    const web3: Web3 = new Web3('http://localhost:8545')
    const kit: ContractKit = newKitFromWeb3(web3)
    const account = (await kit.connection.getAccounts())[0]
    console.info(`Using account: ${account}`)
    kit.connection.defaultAccount = account

    const [epochRewards, freezerContract] = await Promise.all([
      argv.rewards ? kit._web3Contracts.getEpochRewards() : null,
      kit._web3Contracts.getFreezer(),
    ])

    for (const [name, contract] of Object.entries({ epochRewards })) {
      if (contract === null) {
        continue
      }

      const address = contract._address
      if (argv.precheck) {
        const frozen = await freezerContract.methods.isFrozen(address).call()
        // console.debug(`${name}.frozen = ${frozen}`)
        if (argv.freeze === frozen) {
          console.error(`${name} is already ${argv.freeze ? 'frozen' : 'unfrozen'}. Skipping.`)
          continue
        }
      }

      if (argv.freeze) {
        console.info(`Sending freeze transaction to ${name} ...`)
        await freezerContract.methods.freeze(address).send({ from: account })
      } else {
        console.info(`Sending unfreeze transaction to ${name} ...`)
        await freezerContract.methods.unfreeze(address).send({ from: account })
      }

      if (argv.verify) {
        const frozen = await freezerContract.methods.isFrozen(address).call()
        // console.debug(`${name}.frozen = ${frozen}`)
        if (argv.freeze !== frozen) {
          console.error(
            `${name} is not ${argv.freeze ? 'frozen' : 'unfrozen'}. Something went wrong.`
          )
          continue
        }
        console.info(`Succesfully ${argv.freeze ? 'froze' : 'unfroze'} ${name}`)
      }
    }
  }

  try {
    await portForwardAnd(argv.celoEnv, cb)
  } catch (error) {
    console.error(`Unable to ${argv.freeze ? 'freeze' : 'unfreeze'} contracts on ${argv.celoEnv}`)
    console.error(error)
    process.exit(1)
  }
}
