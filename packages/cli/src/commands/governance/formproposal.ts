import { BaseCommand } from '../../base'
import * as inquirer from 'inquirer'
import { CeloContract } from '@celo/contractkit/lib'
import { ABIDefinition } from 'web3/eth/abi'

export default class FormProposal extends BaseCommand {
  static description =
    'Use an interactive prompt to form a governance proposal with the Celo Contract Registry'

  static flags = { ...BaseCommand.flags }

  static examples = ['formproposal']

  requireSynced = false

  async run() {
    this.parse(FormProposal)

    const contractPromptName = 'Celo Contract'
    const contractAnswer = await inquirer.prompt({
      name: contractPromptName,
      type: 'list',
      choices: Object.keys(CeloContract),
    })
    const contractName = contractAnswer[contractPromptName] as CeloContract
    const contractABI = require('@celo/contractkit/lib/generated/' + contractName)
      .ABI as ABIDefinition[]
    const methodNames = contractABI.map((def) => def.name!)

    const functionPromptName = contractName + ' Function'
    const functionAnswer = await inquirer.prompt({
      name: functionPromptName,
      type: 'list',
      choices: methodNames,
    })
    const functionName = functionAnswer[functionPromptName] as string
    const idx = methodNames.findIndex((m) => m === functionName)
    const args = []
    for (const functionInput of contractABI[idx].inputs!) {
      const inputAnswer = await inquirer.prompt({
        name: functionInput.name,
        type: 'input',
        validate: () => {
          // TODO: switch on user input and functionInput.type
          return true
        },
      })
      args.push(inputAnswer[functionInput.name])
    }
  }
}
