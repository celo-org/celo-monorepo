import { ContractKit, newKit } from '@celo/contractkit'
import { CeloProvider } from '@celo/contractkit/lib/providers/celo-provider'
import { getFornoUrl } from 'src/lib/endpoints'
import { envVar, fetchEnv } from 'src/lib/env-utils'
import { AccountType, getPrivateKeysFor } from 'src/lib/generate_utils'
import { installGenericHelmChart, removeGenericHelmChart } from 'src/lib/helm_deploy'
import { ensure0x } from 'src/lib/utils'
import Web3 from 'web3'

const web3 = new Web3()

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

  const kit: ContractKit = newKit(fornoUrl)
  const goldToken = await kit.contracts.getGoldToken()
  const lockedGold = await kit.contracts.getLockedGold()
  const accounts = await kit.contracts.getAccounts()

  const botsWithoutGold: string[] = []

  for (const key of getPrivateKeysFor(AccountType.VOTING_BOT, mnemonic, numBotAccounts)) {
    const botAccount = ensure0x(web3.eth.accounts.privateKeyToAccount(key).address)
    const goldBalance = await goldToken.balanceOf(botAccount)
    if (goldBalance.isZero()) {
      botsWithoutGold.push(botAccount)
      continue
    }

    kit.addAccount(key)

    if (!(await accounts.isAccount(botAccount))) {
      const registerTx = await accounts.createAccount()
      await registerTx.sendAndWaitForReceipt({ from: botAccount })
    }

    const amountLocked = await lockedGold.getAccountTotalLockedGold(botAccount)
    if (amountLocked.isZero()) {
      const tx = await lockedGold.lock()
      const amountToLock = goldBalance.multipliedBy(0.99).toFixed(0)

      await tx.sendAndWaitForReceipt({
        to: lockedGold.address,
        value: amountToLock,
        from: botAccount,
      })
      console.info(`Locked gold for ${botAccount}`)
    }
  }
  if (botsWithoutGold.length > 0) {
    throw new Error(`These bot accounts have no gold. Faucet them, and retry: ${botsWithoutGold}`)
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
