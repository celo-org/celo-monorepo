import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { newKitFromWeb3 } from '../kit'
import { testStableToken } from './BaseStableToken.test'

// TEST NOTES: balances defined in test-utils/migration-override

testWithGanache('StableToken Wrapper', (web3) => {
  const kit = newKitFromWeb3(web3)
  testStableToken(kit, kit.contracts.getStableTokenEUR.bind(kit.contracts), 'Celo Euro', 'cEUR')
})
