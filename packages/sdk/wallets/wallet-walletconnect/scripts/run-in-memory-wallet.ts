import { getTestWallet } from '../src/test/in-memory-wallet'
;(async function main() {
  const uri = process.argv[2]
  if (!uri) {
    return
  }

  const wallet = getTestWallet()
  await wallet.init(uri)
})()
