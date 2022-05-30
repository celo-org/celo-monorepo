import { Address } from '@celo/base/lib/address'
import { NetworkConfig, testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import BigNumber from 'bignumber.js'
import Web3 from 'web3'
import { newKitFromWeb3 } from '../kit'
// import { assumeOwnership } from '../test-utils/transferownership'
import { StableTokenRegistryWrapper } from './StableTokenRegistry'

const expConfig = NetworkConfig.stableTokenRegistry

testWithGanache('StableTokenRegistry Wrapper', (web3: Web3) => {
  const kit = newKitFromWeb3(web3)
  let accounts: Address[] = []
  let stableTokenRegistry: StableTokenRegistryWrapper
})
