import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { testExchange } from './BaseExchange.test'

testWithGanache('ExchangeEUR Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  testExchange(
    kit,
    kit.contracts.getExchangeEUR.bind(kit.contracts),
    kit.contracts.getStableTokenEUR.bind(kit.contracts)
  )
})
