import { sleep } from '@celo/utils/lib/async'
import * as admin from 'firebase-admin'
import { CeloAdapter } from './celo-adapter'
import * as fbHelper from './database-helper'

const serviceAccount = require('./serviceAccountKey.json')
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://celo-faucet.firebaseio.com',
})

// @ts-ignore
async function printAccounts(pool: fbHelper.AccountPool) {
  const accountsSnap = await pool.getAccounts()
  console.log(accountsSnap)

  // const accounts = accountsSnap.val()

  // accountsSnap.forEach((snap: any) => {
  //   console.log(snap.key, snap.val().address, '=>', snap.val().locked)
  // })
}

// @ts-ignore
async function populatePool(pool: fbHelper.AccountPool) {
  await pool.addAccount({
    pk: 'pkpk',
    address: '0x0000000000000000000000001',
    locked: false,
  })
  await pool.addAccount({
    pk: 'pkpk',
    address: '0x0000000000000000000000002',
    locked: false,
  })
  await pool.addAccount({
    pk: 'pkpk',
    address: '0x0000000000000000000000003',
    locked: false,
  })
  await pool.addAccount({
    pk: 'pkpk',
    address: '0x0000000000000000000000004',
    locked: false,
  })
}
// @ts-ignore
function fakeAction(pool: fbHelper.AccountPool) {
  return pool.doWithAccount(async (account) => {
    console.log('GOT Accounts', account)
    await sleep(5000)
  })
}

// @ts-ignore
async function web3Playground() {
  const pk = 'b2f37985e95fb350f83040b4b7cdc5ea925a2a6417aab481358ff5c79bd7b6b7'
  const to = '0x35e48988157f5cf7fdcfe62805174ee385f7e5df'
  // Values for `alfajores`
  const celo = new CeloAdapter({
    nodeUrl: 'http://localhost:8545',
    pk,
  })

  const printBalance = async (addr: string) => {
    console.log(`Account: ${addr}`)
    console.log(`USD: ${await celo.getDollarsBalance(addr)}`)
    console.log(`Gold: ${await celo.getGoldBalance(addr)}`)
    console.log('-------------------------------------------')
  }

  console.log('Before')
  await printBalance(celo.defaultAddress)
  await printBalance(to)

  // const tx = await celo.transferGold(to, '50000000000000')
  // console.log('txhash', await tx.getHash())
  // console.log('receipt', await tx.waitReceipt())

  const tx2 = await celo.transferDollars(to, '50000000000000')
  console.log('txhash', await tx2.send())

  console.log('After')
  await printBalance(celo.defaultAddress)
  await printBalance(to)
}

async function main() {
  // @ts-ignore
  const pool = new fbHelper.AccountPool('integration', {
    retryWaitMS: 1000,
    maxRetries: 2,
  })
  try {
    await web3Playground()
    // await pool.removeAll()
    // await populatePool(pool)

    // await printAccounts(pool)
    // // await Promise.all([fakeAction()])
    // await Promise.all([
    //   fakeAction(pool),
    //   fakeAction(pool),
    //   fakeAction(pool),
    //   fakeAction(pool),
    //   fakeAction(pool),
    //   fakeAction(pool),
    // ])
    // await printAccounts(pool)

    // console.log('after')

    // const tx = await sendFunds({
    //   providerUrl: 'http://34.83.69.157:8545',
    //   fromPk: '0x0e08757b5e1efd8fc93e25188f2a2fea51c9bff6438729c3c7208de2169f9e7a',
    //   to: '0x193eab124b946b79461b484812dca10afb3b2294',
    //   valueEth: '0.05',
    // })
    // console.log(tx)
  } catch (err) {
    console.error('Failed')
    console.error(err)
  } finally {
    await admin.app().delete()
  }
}

main().catch((err) => {
  console.log(err)
})
