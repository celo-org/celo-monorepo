import { newKit } from './src'
import { newBlockExplorer } from './src/explorer/block-explorer'

const kit = newKit('ws://localhost:8545')

export function listenFor(subscription: any, seconds: number) {
  console.log(subscription)

  return new Promise((resolve, reject) => {
    const accumulator: any[] = []

    subscription.on('data', (data: any) => {
      accumulator.push(data)
    })
    setTimeout(() => {
      subscription.unsubscribe()
      resolve(accumulator)
    }, seconds * 1000)

    subscription.on('error', (err: any) => {
      reject(err)
    })
  })
}

const printJSON = (x: any) => console.log(JSON.stringify(x, null, 2))

async function main() {
  const blockExplorer = await newBlockExplorer(kit)

  const blocks = await blockExplorer.fetchBlockRange(15, 50)

  blocks.forEach((block) => {
    console.log('Block', block.number)
    printJSON(blockExplorer.parseBlock(block))
  })
  // const pastStableEvents = await stableToken.getPastEvents('allevents', { fromBlock: 0 })

  // const pastGenericEvents = await kit.web3.eth.getPastLogs({
  //   address: '0x371b13d97f4bf77d724e78c16b7dc74099f40e84',
  //   fromBlock: '0x0',
  // })

  // printJSON(pastStableEvents)
  // console.log('------------------------------------------------------')
  // printJSON(pastGenericEvents)

  // const tokenEvents = await listenFor(stableToken.events.allEvents({ fromBlock: 0 }), 3)

  // console.log(JSON.stringify(tokenEvents[0], null, 2))

  // const genEvents = await listenFor(
  //   kit.web3.eth.subscribe('logs', {
  //     address: '0x371b13d97f4bf77d724e78c16b7dc74099f40e84',
  //     fromBlock: 0,
  //     topics: [],
  //   }),
  //   3
  // )

  // console.log(JSON.stringify(genEvents, null, 2))
  ;(kit.web3.currentProvider as any).disconnect()
}

main().catch((err) => {
  console.error(err)
})
