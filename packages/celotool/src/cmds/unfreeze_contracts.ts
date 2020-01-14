/* tslint:disable no-console */
import { newKit } from '@celo/contractkit'
import { eqAddress } from '@celo/utils/lib/address'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import { addCeloEnvMiddleware, CeloEnvArgv } from 'src/lib/env-utils'
import { portForwardAnd } from 'src/lib/port_forward'
import yargs from 'yargs'

export const command = 'unfreeze-contracts'

export const describe = 'command for unfreezing epoch rewards and the exchange'

interface UnfreezeContractsArgv extends CeloEnvArgv {
  exchange: boolean
  rewards: boolean
  freeze: boolean
  precheck: boolean
  verify: boolean
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('exchange', {
      type: 'boolean',
      description: 'Affect the exchange',
      default: true,
    })
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
  await switchToClusterFromEnv()

  const cb = async () => {
    const kit = newKit('http://localhost:8545')
    const account = (await kit.web3.eth.getAccounts())[0]
    console.log(`Using account: ${account}`)
    kit.defaultAccount = account

    const [exchange, epochRewards] = await Promise.all([
      argv.exchange ? kit._web3Contracts.getExchange() : null,
      argv.rewards ? kit._web3Contracts.getEpochRewards() : null,
    ])

    for (const [name, contract] of Object.entries({ exchange, epochRewards })) {
      if (contract === null) {
        continue
      }

      if (argv.precheck) {
        const frozen = await contract.methods.frozen().call()
        // console.debug(`${name}.frozen = ${frozen}`)
        if (argv.freeze === frozen) {
          console.error(`${name} is already ${argv.freeze ? 'frozen' : 'unfrozen'}. Skipping.`)
          continue
        }

        const freezer = await contract.methods.freezer().call()
        // console.debug(`${name}.freezer = ${freezer}`)
        if (!eqAddress(freezer, account)) {
          console.error(`${account} cannot freeze or unfreeze ${name}. Skipping.`)
          continue
        }
      }

      if (argv.freeze) {
        console.info(`Sending freeze transaction to ${name} ...`)
        await contract.methods.freeze().send({ from: account })
      } else {
        console.info(`Sending unfreeze transaction to ${name} ...`)
        await contract.methods.unfreeze().send({ from: account })
      }

      if (argv.verify) {
        const frozen = await contract.methods.frozen().call()
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
