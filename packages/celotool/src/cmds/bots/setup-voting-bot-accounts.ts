import { ContractKit, newKit } from '@celo/contractkit'
import { getAccountAddressFromPrivateKey } from '@celo/walletkit'
import { BotsArgv } from 'src/cmds/bots'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { ensure0x } from 'src/lib/utils'
import { Argv } from 'yargs'

export const command = 'setup-voting'

export const describe = 'for each of the voting bot accounts, vote for the best groups available'

interface SetupVotingBotArgv extends BotsArgv {
  celoProvider: string
}

export const builder = (yargs: Argv) => {
  return yargs.option('celoProvider', {
    type: 'string',
    description: 'The node to use',
    default: 'http://localhost:8545',
  })
}

export const handler = async function setupVotingBotAccounts(argv: SetupVotingBotArgv) {
  try {
    const mnemonic = fetchEnv(envVar.MNEMONIC)
    const numBotAccounts = parseInt(fetchEnv(envVar.VOTING_BOTS), 10)

    const kit: ContractKit = newKit(argv.celoProvider)
    const goldToken = await kit.contracts.getGoldToken()
    const lockedGold = await kit.contracts.getLockedGold()
    const accounts = await kit.contracts.getAccounts()

    const botsWithoutGold: string[] = []

    const botKeys = getPrivateKeysFor(AccountType.VOTING_BOT, mnemonic, numBotAccounts)
    for (const key of botKeys) {
      const botAccount = ensure0x(getAccountAddressFromPrivateKey(key))
      kit.addAccount(key)
      kit.defaultAccount = botAccount

      try {
        const goldBalance = await goldToken.balanceOf(botAccount)
        if (goldBalance.isZero()) {
          botsWithoutGold.push(botAccount)
          continue
        }
        if (!(await accounts.isAccount(botAccount))) {
          const registerTx = await accounts.createAccount()
          await registerTx.sendAndWaitForReceipt()
        }

        const botLockedGold = await lockedGold.getAccountTotalLockedGold(botAccount)
        if (botLockedGold.isEqualTo(0)) {
          const tx = await lockedGold.lock()
          const amountToLock = goldBalance.multipliedBy(0.99).toFixed(0)

          await tx.sendAndWaitForReceipt({
            to: lockedGold.address,
            value: amountToLock,
            from: botAccount,
          })
          console.info(`Locked gold for ${botAccount}`)
        } else {
          console.info(`Bot ${botAccount} already has locked gold`)
        }
      } catch (error) {
        console.error(`Failed to confirm or do setup for ${botAccount}`)
        console.error(error.toString())
      }
    }
    console.info(`These bot accounts have no gold, and need to be fauceted: ${botsWithoutGold}`)
  } catch (error) {
    console.error(error)
  }
  process.exit(0)
}
