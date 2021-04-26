import BigNumber from 'bignumber.js'
import { CeloContract, newKit } from './packages/sdk/contractkit'
import { StableToken } from './packages/sdk/contractkit/lib/celo-tokens'

async function sendcEUR(kit, fromAddres, toAddress) {
  const to_send = new BigNumber('300e18')
  let stabletokenEUR = await kit.contracts.getStableTokenEUR()
  console.log('sending...')
  await stabletokenEUR.transfer(toAddress, to_send).send({ from: fromAddres })

  // stabletokenEUR = await kit.contracts.getStableToken()
  // console.log('sending...')
  // await stabletokenEUR.transfer(toAddress, 1).send({from: fromAddres})
  // stabletokenEUR = await kit.contracts.getGoldToken()
  // console.log('sending...')
  // await stabletokenEUR.transfer(toAddress, 100e18).send({from: fromAddres})
}

async function exchange(kit, fromAddres) {
  console.log('exchange should not work')
  const exchange = await kit.contracts.getExchangeEUR()
  let celotoken = await kit.contracts.getGoldToken()

  console.log('exchange address', exchange.address)
  console.log('buckets:' + (await exchange.getBuyAndSellBuckets(true)))
  // console.log("increase allowance")
  await celotoken
    .increaseAllowance(exchange.address, (1000e18).toFixed())
    .sendAndWaitForReceipt({ from: fromAddres })
  await celotoken
    .increaseAllowance(celotoken.address, (1000e18).toFixed())
    .sendAndWaitForReceipt({ from: fromAddres })
  console.log('exchanging...')

  await exchange.exchange(100e18, 0, true).sendAndWaitForReceipt()

  // try {
  //   await exchange.buy(1e18, 1e20, true).sendAndWaitForReceipt()
  // } catch (error) {
  //   console.log('buy failed:' + error)
  // }
  // console.log('increase allowance')
  // await celotoken
  //   .increaseAllowance(exchange.address, (1000e18).toFixed())
  //   .sendAndWaitForReceipt({ from: fromAddres })
  // await celotoken
  //   .increaseAllowance(celotoken.address, (1000e18).toFixed())
  //   .sendAndWaitForReceipt({ from: fromAddres })

  // console.log('exchanging...')
  // try {
  //   await exchange.sell(100e18, 0, true).sendAndWaitForReceipt()
  // } catch (error) {
  //   console.log('sell failed:' + error)
  // }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
  // const kit = newKit('http://localhost:8545')
  const kit = newKit('https://forno.celo.org')
  // kit.connection.addAccount('')
  const pre_mint_account = '0x0Cc59Ed03B3e763c02d54D695FFE353055f1502D' //'0xb04778c00a8e30f59bfc91dd74853c4f32f34e54'

  const to = '0x59cCd90e112750DF068efaa58e301A6816344b46'

  kit.defaultAccount = pre_mint_account

  await kit.setFeeCurrency(CeloContract.StableToken)

  while (true) {
    console.log(new Date(Date.now()).toISOString())
    const exchange = await kit.contracts.getExchange(StableToken.cEUR)
    const buckets = await exchange.getBuyAndSellBuckets(true)
    // console.log()
    console.log('buckets:' + buckets[0].toString() + ' ' + buckets[1].toString())
    console.log('price: ' + buckets[0].dividedBy(buckets[1]))
    // console.log('last_bucket_update:' + (buckets[0].toString(), buckets[1].toString()))
    await sleep(4000)
  }

  // console.log('Median rate:' + (await kit.contracts.getSortedOracles()).get )

  // console.log('StableToken address:' + (await kit.contracts.getStableTokenEUR()).)

  // console.log('StableToken address:' + (await kit.contracts.getStableTokenEUR()).address)
  // console.log('Reserve Unfrozen:' + await (await kit.contracts.getReserve()).getUnfrozenBalance())

  // console.log('Oracle exchange rate:' + await (await kit.contracts.getExchangeEUR()).shouldUpdateBuckets())
  // console.log('Oracle exchange rate:' + await (await kit.contracts.getExchangeEUR()).getOracleExchangeRate())

  // console.log('Address in exchange:' + await (await kit.contracts.getExchangeEUR()).stableToken())

  // console.log("Community fund balance")
  // let totalBalance = await kit.getTotalBalance('0xCF691062547bbe97B25B07f69C2Bffc93B4ddb96')
  // console.log(totalBalance)

  // console.log("Pre-mint address")
  // totalBalance = await kit.getTotalBalance(pre_mint_account)
  // console.log(totalBalance)

  // console.log("Pre-mint address")
  // totalBalance = await kit.getTotalBalance(pre_mint_account)
  // console.log(totalBalance['cEUR'].toString())

  // await exchange(kit, pre_mint_account)

  // console.log('Send some cEUR')
  // sendcEUR(
  //   kit,
  //   pre_mint_account, // from
  //   to
  // ) // to
}

main()
  .then((text) => {})
  .catch((err) => {
    console.log(err)
  })
