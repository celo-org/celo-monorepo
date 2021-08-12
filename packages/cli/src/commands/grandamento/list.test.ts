import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import List from './list'

testWithGanache('grandamento:list cmd', () => {
  // const kit = newKitFromWeb3(web3)
  jest.spyOn(console, 'log')

  beforeEach(async () => {
    // console.log("hola")
  })

  it('shows an empty list', async () => {
    await List.run([])
  })
})
