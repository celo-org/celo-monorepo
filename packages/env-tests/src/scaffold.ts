import { concurrentMap } from '@celo/base'
import { ContractKit } from '@celo/contractkit'
import { generateKeys } from '@celo/utils/lib/account'
import { privateKeyToAddress } from '@celo/utils/lib/address'
import BigNumber from 'bignumber.js'
import { config } from 'dotenv'
import { existsSync } from 'fs'
import path from 'path'

export async function fundAccount(
  kit: ContractKit,
  mnemonic: string,
  account: TestAccounts,
  value: BigNumber
) {
  const root = await getKey(mnemonic, TestAccounts.Root)
  const recipient = await getKey(mnemonic, account)
  kit.addAccount(root.privateKey)
  const stableToken = await kit.contracts.getStableToken()

  const rootBalance = await stableToken.balanceOf(root.address)

  if (rootBalance.lte(value)) {
    throw new Error(
      `Root account ${root.address}'s balance (${rootBalance.toPrecision(
        4
      )}) is not enough for transferring ${value.toPrecision(4)}`
    )
  }
  await stableToken
    .transfer(recipient.address, value.toString())
    .sendAndWaitForReceipt({ from: root.address })
}

export async function getKey(mnemonic: string, account: TestAccounts) {
  const key = await generateKeys(mnemonic, undefined, 0, account)
  return { ...key, address: privateKeyToAddress(key.privateKey) }
}

export enum TestAccounts {
  Root,
  TransferFrom,
  TransferTo,
  Exchange,
}

export const ONE = new BigNumber('1000000000000000000')

export async function clearAllFundsToRoot(kit: ContractKit, mnemonic: string) {
  const accounts = Array.from(
    new Array(Object.keys(TestAccounts).length / 2),
    (_val, index) => index
  )
  const root = await getKey(mnemonic, TestAccounts.Root)
  const stableToken = await kit.contracts.getStableToken()
  const goldToken = await kit.contracts.getGoldToken()
  await concurrentMap(5, accounts, async (_val, index) => {
    if (index === 0) {
      return
    }
    const account = await getKey(mnemonic, index)
    kit.addAccount(account.privateKey)

    const balance = await stableToken.balanceOf(account.address)
    if (balance.gt(ONE)) {
      await stableToken
        .transfer(
          root.address,
          balance
            .times(0.99)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString()
        )
        .sendAndWaitForReceipt({ feeCurrency: stableToken.address, from: account.address })
    }

    const celoBalance = await goldToken.balanceOf(account.address)
    if (celoBalance.gt(ONE)) {
      await goldToken
        .transfer(
          root.address,
          celoBalance
            .times(0.99)
            .integerValue(BigNumber.ROUND_DOWN)
            .toString()
        )
        .sendAndWaitForReceipt({ from: account.address })
    }
  })
}

// Only use this if in monorepo and env files are as expected and in dev
export function loadFromEnvFile() {
  const envName = process.env.CELO_ENV

  if (!envName) {
    return
  }

  const envFile = getEnvFile(envName, '.mnemonic')
  config({ path: envFile })

  return envName
}

export const monorepoRoot = path.resolve(process.cwd(), './../..')
export const genericEnvFilePath = path.resolve(monorepoRoot, '.env')

export function getEnvFile(celoEnv: string, envBegining: string = '') {
  const filePath: string = path.resolve(monorepoRoot, `.env${envBegining}.${celoEnv}`)
  if (existsSync(filePath)) {
    return filePath
  } else {
    return `${genericEnvFilePath}${envBegining}`
  }
}
