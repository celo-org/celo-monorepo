import { database } from 'firebase-admin'
import { DataSnapshot } from 'firebase-functions/lib/providers/database'
import Web3 from 'web3'
import { CeloAdapter } from './celo-adapter'
import { NetworkConfig } from './config'
import { generateInviteCode, getPhoneHash, isE164Number, wait } from './utils'

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

export interface RequestRecord {
  beneficiary: Address
  status: RequestStatus
  txHash?: string
  type: RequestType
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
      throw new Error(`Unkown request type: ${request.type}`)
    }
    const success = await pool.doWithAccount(requestHandler)
    await snap.ref.update({ status: success ? RequestStatus.Done : RequestStatus.Failed })
  } catch (err) {
    console.error(`req(${snap.key}): ERROR proccessRequest`, err)
    await snap.ref.update({ status: RequestStatus.Failed })
    throw err
  }
}

function buildHandleFaucet(request: RequestRecord, snap: DataSnapshot, config: NetworkConfig) {
  return async (account: AccountRecord) => {
    const celo = new CeloAdapter(
      new Web3(config.nodeUrl),
      account.pk,
      config.stableTokenAddress,
      config.escrowAddress,
      config.goldTokenAddress
    )
    const goldTx = await celo.transferGold(request.beneficiary, config.faucetGoldAmount)
    const goldTxHash = await goldTx.getHash()
    console.info(`req(${snap.key}): Gold Transaction Sent. txhash:${goldTxHash}`)
    await snap.ref.update({ goldTxHash })
    await goldTx.waitReceipt()

    const dollarTx = await celo.transferDollars(request.beneficiary, config.faucetDollarAmount)
    const dollarTxHash = await dollarTx.getHash()
    console.info(`req(${snap.key}): Dollar Transaction Sent. txhash:${dollarTxHash}`)
    await snap.ref.update({ dollarTxHash })
    await dollarTx.waitReceipt()
  }
}

function buildHandleInvite(request: RequestRecord, snap: DataSnapshot, config: NetworkConfig) {
  return async (account: AccountRecord) => {
    if (!config.twilioClient) {
      throw new Error('Cannot send an invite without a valid twilio client')
    }
    if (!isE164Number(request.beneficiary)) {
      throw new Error('Must send to valid E164 Number.')
    }
    const celo = new CeloAdapter(
      new Web3(config.nodeUrl),
      account.pk,
      config.stableTokenAddress,
      config.escrowAddress,
      config.goldTokenAddress
    )
    const { address: tempAddress, inviteCode } = generateInviteCode()
    const goldTx = await celo.transferGold(tempAddress, config.inviteGoldAmount)
    const goldTxHash = await goldTx.getHash()
    console.info(`req(${snap.key}): Gold Transaction Sent. txhash:${goldTxHash}`)
    await snap.ref.update({ goldTxHash })
    await goldTx.waitReceipt()

    const dollarTx = await celo.transferDollars(tempAddress, config.inviteDollarAmount)
    const dollarTxHash = await dollarTx.getHash()
    console.info(`req(${snap.key}): Dollar Transaction Sent. txhash:${dollarTxHash}`)
    await snap.ref.update({ dollarTxHash })
    await dollarTx.waitReceipt()

    const phoneHash = getPhoneHash(request.beneficiary)
    const escrowTx = await celo.escrowDollars(
      phoneHash,
      tempAddress,
      config.escrowDollarAmount,
      config.expirarySeconds,
      config.minAttestations
    )
    const escrowTxHash = await escrowTx.getHash()
    console.info(`req(${snap.key}): Escrow Dollar Transaction Sent. txhash:${dollarTxHash}`)
    await snap.ref.update({ escrowTxHash })
    await escrowTx.waitReceipt()

    if (config.twilioClient) {
      const messageText = `Hello! Thank you for joining the Celo network. Your invite code is: ${inviteCode} Download the app at https://play.google.com/store/apps/details?id=org.celo.mobile.alfajores`
      await config.twilioClient.messages.create({
        body: messageText,
        from: config.twilioPhoneNumber,
        to: request.beneficiary,
      })
    }
  }
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

  async doWithAccount(action: (account: AccountRecord) => Promise<any>) {
    const accountSnap = await this.tryLockAccountWithRetries()
    if (accountSnap) {
      try {
        await withTimeout(this.options.actionTimeoutMS, () => action(accountSnap.val()))
      } finally {
        await accountSnap.child('locked').ref.set(false)
      }
      return true
    } else {
      return false
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
          await wait(this.options.retryWaitMS)
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
