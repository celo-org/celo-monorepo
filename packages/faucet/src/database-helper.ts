/* tslint:disable max-classes-per-file */
import { PhoneNumberUtils } from '@celo/utils'
import { retryAsync, sleep } from '@celo/utils/lib/async'
import { database } from 'firebase-admin'
import { DataSnapshot } from 'firebase-functions/lib/providers/database'
import { CeloAdapter } from './celo-adapter'
import { NetworkConfig } from './config'
import { ExecutionResult, logExecutionResult } from './metrics'
import { generateInviteCode } from './utils'

export type Address = string
export interface AccountRecord {
  pk: string
  address: Address
  locked: boolean
}

export enum RequestStatus {
  Pending = 'Pending',
  Working = 'Working',
  Done = 'Done',
  Failed = 'Failed',
}

export enum RequestType {
  Faucet = 'Faucet',
  Invite = 'Invite',
}

enum MobileOS {
  android = 'android',
  ios = 'ios',
}

export interface RequestRecord {
  beneficiary: Address
  status: RequestStatus
  type: RequestType
  mobileOS?: MobileOS // only on invite
  dollarTxHash?: string
  goldTxHash?: string
  escrowTxHash?: string // only on Invites
}

export async function processRequest(snap: DataSnapshot, pool: AccountPool, config: NetworkConfig) {
  const request = snap.val() as RequestRecord
  if (request.status !== RequestStatus.Pending) {
    return
  }

  await snap.ref.update({ status: RequestStatus.Working })
  console.info(
    `req(${snap.key}): Started working on ${request.type} request for:${request.beneficiary}`
  )

  try {
    let requestHandler
    if (request.type === RequestType.Faucet) {
      requestHandler = buildHandleFaucet(request, snap, config)
    } else if (request.type === RequestType.Invite) {
      requestHandler = buildHandleInvite(request, snap, config)
    } else {
      logExecutionResult(snap.key, ExecutionResult.InvalidRequestErr)
      return ExecutionResult.InvalidRequestErr
    }

    const actionResult = await pool.doWithAccount(requestHandler)
    if (actionResult === ActionResult.Ok) {
      await snap.ref.update({ status: RequestStatus.Done })
      logExecutionResult(snap.key, ExecutionResult.Ok)
      return ExecutionResult.Ok
    } else {
      await snap.ref.update({ status: RequestStatus.Failed })
      const result =
        actionResult === ActionResult.NoFreeAccount
          ? ExecutionResult.NoFreeAccountErr
          : ExecutionResult.ActionTimedOutErr
      logExecutionResult(snap.key, result)
      return result
    }
  } catch (err) {
    logExecutionResult(snap.key, ExecutionResult.OtherErr)
    console.error(`req(${snap.key}): ERROR proccessRequest`, err)
    await snap.ref.update({ status: RequestStatus.Failed })
    throw err
  }
}

function buildHandleFaucet(request: RequestRecord, snap: DataSnapshot, config: NetworkConfig) {
  return async (account: AccountRecord) => {
    const { nodeUrl, faucetDollarAmount, faucetGoldAmount } = config
    const celo = new CeloAdapter({ nodeUrl, pk: account.pk })
    await retryAsync(sendGold, 3, [celo, request.beneficiary, faucetGoldAmount, snap], 500)
    await retryAsync(sendDollars, 3, [celo, request.beneficiary, faucetDollarAmount, snap], 500)
  }
}

function buildHandleInvite(request: RequestRecord, snap: DataSnapshot, config: NetworkConfig) {
  return async (account: AccountRecord) => {
    if (!config.twilioClient) {
      throw new Error('Cannot send an invite without a valid twilio client')
    }
    if (!PhoneNumberUtils.isE164Number(request.beneficiary)) {
      throw new Error('Must send to valid E164 Number.')
    }
    console.info(`req(${snap.key}): Creating Celo Adapter`)
    const celo = new CeloAdapter({ nodeUrl: config.nodeUrl, pk: account.pk })
    console.info(`req(${snap.key}): New kit created`)
    const { address: tempAddress, inviteCode } = generateInviteCode()
    console.info(`req(${snap.key}): Invite code generated`)

    await retryAsync(sendGold, 3, [celo, tempAddress, config.inviteGoldAmount, snap], 500)
    await retryAsync(sendDollars, 3, [celo, tempAddress, config.inviteDollarAmount, snap], 500)

    const phoneHash = PhoneNumberUtils.getPhoneHash(request.beneficiary)
    console.info(`req(${snap.key}): Sending escrow payment for phone hash ${phoneHash}`)
    const escrowTx = await celo.escrowDollars(
      phoneHash,
      tempAddress,
      config.escrowDollarAmount,
      config.expirySeconds,
      config.minAttestations
    )
    const escrowReceipt = await escrowTx.sendAndWaitForReceipt()
    const escrowTxHash = escrowReceipt.transactionHash
    console.info(`req(${snap.key}): Escrow Dollar Transaction Sent. txhash:${escrowTxHash}`)
    await snap.ref.update({ escrowTxHash })

    console.info(`req(${snap.key}): Txs done, stopping kit`)
    celo.stop()

    await config.twilioClient.messages.create({
      body: messageText(inviteCode, request),
      from: config.twilioPhoneNumber,
      to: request.beneficiary,
    })
  }
}

async function sendDollars(
  celo: CeloAdapter,
  address: Address,
  amount: string,
  snap: DataSnapshot
) {
  console.info(`req(${snap.key}): Sending ${amount} dollars`)
  const dollarTx = await celo.transferDollars(address, amount)
  const dollarTxReceipt = await dollarTx.sendAndWaitForReceipt()
  const dollarTxHash = dollarTxReceipt.transactionHash
  console.info(`req(${snap.key}): Dollar Transaction Sent. txhash:${dollarTxHash}`)
  await snap.ref.update({ dollarTxHash })
  return dollarTxHash
}

async function sendGold(celo: CeloAdapter, address: Address, amount: string, snap: DataSnapshot) {
  console.info(`req(${snap.key}): Sending ${amount} gold`)
  const goldTx = await celo.transferGold(address, amount)
  const goldTxReceipt = await goldTx.sendAndWaitForReceipt()
  const goldTxHash = goldTxReceipt.transactionHash
  console.info(`req(${snap.key}): Gold Transaction Sent. txhash:${goldTxHash}`)
  await snap.ref.update({ goldTxHash })
  return goldTxHash
}

function messageText(inviteCode: string, request: RequestRecord) {
  return `Hello! Thank you for joining the Celo network. Your invite code is: ${inviteCode} Download the app at ${downloadLink(
    request.mobileOS as MobileOS
  )}`
}

const IOS_URL = 'https://apps.apple.com/us/app/celo-alfajores-wallet/id1482389446'
const ANDROID_URL = 'https://play.google.com/store/apps/details?id=org.celo.mobile.alfajores'

function downloadLink(mobileOS: MobileOS) {
  return mobileOS === MobileOS.ios ? IOS_URL : ANDROID_URL
}

function withTimeout<A>(
  timeout: number,
  fn: () => Promise<A>,
  onTimeout?: () => A | Promise<A>
): Promise<A> {
  return new Promise((resolve, reject) => {
    let timeoutHandler: number | null = setTimeout(() => {
      timeoutHandler = null

      if (onTimeout) {
        resolve(onTimeout())
      } else {
        reject(new Error(`Timeout after ${timeout} ms`))
      }
    }, timeout)

    fn()
      .then((val) => {
        if (timeoutHandler !== null) {
          clearTimeout(timeoutHandler)
          resolve(val)
        }
      })
      .catch((err) => {
        if (timeoutHandler !== null) {
          clearTimeout(timeoutHandler)
          reject(err)
        }
      })
  })
}

export interface PoolOptions {
  retryWaitMS: number
  getAccountTimeoutMS: number
  actionTimeoutMS: number
}

const SECOND = 1000

enum ActionResult {
  Ok,
  NoFreeAccount,
  ActionTimeout,
}
export class AccountPool {
  constructor(
    private db: database.Database,
    private network: string,
    private options: PoolOptions = {
      getAccountTimeoutMS: 10 * SECOND,
      retryWaitMS: 3000,
      actionTimeoutMS: 50 * SECOND,
    }
  ) {}

  get accountsRef() {
    return this.db.ref(`/${this.network}/accounts`)
  }

  removeAll() {
    return this.accountsRef.remove()
  }

  addAccount(account: AccountRecord) {
    return this.accountsRef.push(account)
  }

  getAccounts() {
    return this.accountsRef.once('value').then((snap) => snap.val())
  }

  async doWithAccount(action: (account: AccountRecord) => Promise<any>): Promise<ActionResult> {
    const accountSnap = await this.tryLockAccountWithRetries()
    if (!accountSnap) {
      return ActionResult.NoFreeAccount
    }

    try {
      return withTimeout(
        this.options.actionTimeoutMS,
        async () => {
          await action(accountSnap.val())
          return ActionResult.Ok
        },
        () => ActionResult.ActionTimeout
      )
    } finally {
      await accountSnap.child('locked').ref.set(false)
    }
  }

  async tryLockAccountWithRetries() {
    let end = false
    let retries = 0

    const loop = async () => {
      while (!end) {
        const acc = await this.tryLockAccount()
        if (acc != null) {
          return acc
        } else {
          await sleep(this.options.retryWaitMS)
          retries++
        }
      }
      return null
    }

    const onTimeout = () => {
      end = true
      return null
    }

    const account = await withTimeout(this.options.getAccountTimeoutMS, loop, onTimeout)

    if (account) {
      console.info(`LockAccount: ${account.val().address} (after ${retries - 1} retries)`)
    } else {
      console.warn(`LockAccount: Failed`)
    }
    return account
  }

  async tryLockAccount(): Promise<null | database.DataSnapshot> {
    const accountsSnap = await this.accountsRef.once('value')

    const accountKeys: string[] = []
    accountsSnap.forEach((accSnap) => {
      accountKeys.push(accSnap.key!)
    })

    for (const key of accountKeys) {
      const lockPath = accountsSnap.child(key + '/locked')
      if (!lockPath.val() && (await this.trySetLockField(lockPath.ref))) {
        return accountsSnap.child(key)
      }
    }

    return null
  }

  /**
   * Try to set `locked` field to true.
   *
   * @param lockRef Reference to lock field
   * @returns Wether it sucessfully updated the field
   */
  private async trySetLockField(lockRef: database.Reference) {
    const txres = await lockRef.transaction((curr: boolean) => {
      if (curr) {
        return // already locked, abort
      } else {
        return true
      }
    })
    return txres.committed
  }
}
