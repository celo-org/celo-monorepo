import { ContractKit, newKit } from '@celo/contractkit'
import { CeloProvider } from '@celo/contractkit/lib/providers/celo-provider'
import { getAccountAddressFromPrivateKey } from '@celo/walletkit'
import BigNumber from 'bignumber.js'
import { getFornoUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { ensure0x } from 'src/lib/utils'

const helmChartPath = '../helm-charts/voting-bot'

export async function installHelmChart(celoEnv: string, excludedGroups?: string[]) {
  const params = await helmParameters(celoEnv, excludedGroups)
  console.info(params)
  return installGenericHelmChart(celoEnv, releaseName(celoEnv), helmChartPath, params)
}
export async function removeHelmRelease(celoEnv: string) {
  await removeGenericHelmChart(releaseName(celoEnv))
}

export async function setupVotingBotAccounts(celoEnv: string) {
  const fornoUrl = getFornoUrl(celoEnv)
  const mnemonic = fetchEnv(envVar.MNEMONIC)
  const numBotAccounts = parseInt(fetchEnv(envVar.VOTING_BOTS), 10)
  const botStartingBalance = new BigNumber(fetchEnv(envVar.VOTING_BOT_BALANCE))

  const kit: ContractKit = newKit(fornoUrl)
  const goldToken = await kit.contracts.getGoldToken()
  const lockedGold = await kit.contracts.getLockedGold()
  const accounts = await kit.contracts.getAccounts()

  const botsWithoutEnoughGold: string[] = []

  for (const key of getPrivateKeysFor(AccountType.VOTING_BOT, mnemonic, numBotAccounts)) {
    const botAccount = ensure0x(getAccountAddressFromPrivateKey(key))
    const goldBalance = await goldToken.balanceOf(botAccount)
    // Assume that running bot accounts will have used some of their gold in transaction fees, so
    // be tolerant of that decrease
    if (goldBalance.isLessThan(botStartingBalance.multipliedBy(0.99))) {
      botsWithoutEnoughGold.push(botAccount)
      continue
    }

    kit.addAccount(key)

    if (!(await accounts.isAccount(botAccount))) {
      const registerTx = await accounts.createAccount()
      await registerTx.sendAndWaitForReceipt({ from: botAccount })
    }

    const amountLocked = await lockedGold.getAccountTotalLockedGold(botAccount)
    const totalAmountToBeLocked = botStartingBalance.multipliedBy(0.99)

    if (amountLocked.isLessThan(totalAmountToBeLocked)) {
      const amountToLock = totalAmountToBeLocked.minus(amountLocked).toFixed(0)
      console.info(`locking ${amountToLock} for ${botAccount}`)
      const tx = await lockedGold.lock()
      await tx.sendAndWaitForReceipt({
        to: lockedGold.address,
        value: amountToLock,
        from: botAccount,
      })
      console.info(`Locked gold for ${botAccount}`)
    }
  }
  if (botsWithoutEnoughGold.length > 0) {
    console.error(`These bot accounts need to be fauceted: ${botsWithoutEnoughGold}`)
    console.error('Run the following command to fix this:')
    throw new Error(
      `Faucet the bots and try again \n
      celotool account faucet --gold ${botStartingBalance
        .div(1000000000000000000)
        .toFixed()} --dollar 0 -e ${celoEnv} --account ${botsWithoutEnoughGold}
      `
    )
  }
  console.info('Finished/confirmed setup of voting bot accounts')

  if (kit.web3.currentProvider instanceof CeloProvider) {
    const celoProvider = kit.web3.currentProvider as CeloProvider
    celoProvider.stop()
  }
}

function helmParameters(celoEnv: string, excludedGroups?: string[]) {
  const params = [
    `--set celoProvider=${getFornoUrl(celoEnv)}`,
    `--set cronSchedule="${fetchEnv(envVar.VOTING_BOT_CRON_SCHEDULE)}"`,
    `--set domain.name=${fetchEnv(envVar.CLUSTER_DOMAIN_NAME)}`,
    `--set environment=${celoEnv}`,
    `--set imageRepository=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_REPOSITORY)}`,
    `--set imageTag=${fetchEnv(envVar.CELOTOOL_DOCKER_IMAGE_TAG)}`,
    `--set mnemonic="${fetchEnv(envVar.MNEMONIC)}"`,
    `--set votingBot.changeBaseline="${fetchEnv(envVar.VOTING_BOT_CHANGE_BASELINE)}"`,
    `--set votingBot.count=${fetchEnv(envVar.VOTING_BOTS)}`,
    `--set votingBot.exploreProbability="${fetchEnv(envVar.VOTING_BOT_EXPLORE_PROBABILITY)}"`,
    `--set votingBot.scoreSensitivity="${fetchEnv(envVar.VOTING_BOT_SCORE_SENSITIVITY)}"`,
    `--set votingBot.wakeProbability="${fetchEnv(envVar.VOTING_BOT_WAKE_PROBABILITY)}"`,
  ]

  if (excludedGroups && excludedGroups.length > 0) {
    params.push(`--set votingBot.excludedGroups="${excludedGroups.join('\\,')}"`)
  }
  return params
}

function releaseName(celoEnv: string) {
  return `${celoEnv}-voting-bot`
}
