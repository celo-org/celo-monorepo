// tslint:disable-next-line: no-reference (Required to make this work w/ ts-node)
/// <reference path="../../../contractkit/types/web3-celo.d.ts" />

import { ContractKit, newKitFromWeb3 } from '@celo/contractkit'
import { assert } from 'chai'
import Web3 from 'web3'
import { GethRunConfig } from '../lib/interfaces/geth-run-config'
import { getHooks, sleep, waitForBlock } from './utils'

const TMP_PATH = '/tmp/e2e'

describe('snark slashing tests', function(this: any) {
  const gethConfig: GethRunConfig = {
    network: 'local',
    networkId: 1101,
    runPath: TMP_PATH,
    migrate: true,
    instances: [
      {
        name: 'validator0',
        validating: true,
        syncmode: 'full',
        port: 30311,
        rpcport: 8545,
      },
    ],
  }

  const hooks: any = getHooks(gethConfig)
  let web3: Web3
  let kit: ContractKit

  before(async function(this: any) {
    this.timeout(0)
    // Comment out the following line after a test run for a quick rerun.
    await hooks.before()
  })

  after(async function(this: any) {
    this.timeout(0)
    await hooks.after()
  })

  const restart = async () => {
    await hooks.restart()
    web3 = new Web3('http://localhost:8545')
    kit = newKitFromWeb3(web3)
    await sleep(1)
  }

  describe('when running a network', () => {
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
    })

    it('should get correct validator address using the precompile', async () => {
      const contract = await kit._web3Contracts.getElection()
      const validators = await kit._web3Contracts.getValidators()
      const addr = await contract.methods.validatorSignerAddressFromSet(0, 10).call()
      const blsPublicKey = await contract.methods.validatorBLSPublicKeyFromSet(0, 10).call()
      const blsKey = await validators.methods.getValidatorBlsPublicKeyFromSigner(addr).call()
      // console.info('addr', addr, 'bls', blsPublicKey, 'compressed', blsKey)
      assert.equal(blsPublicKey.substr(0, 2 + 96 * 2 - 1), blsKey.substr(0, 2 + 96 * 2 - 1))
    })
  })

  describe('test slashing for double signing with contractkit', () => {
    before(async function(this: any) {
      this.timeout(0) // Disable test timeout
      await restart()
    })

    it('slash for double signing with contractkit', async function(this: any) {
      this.timeout(0) // Disable test timeout
      const slasher = await kit.contracts.getSnarkEpochDataSlasher()
      const election = await kit.contracts.getElection()
      await waitForBlock(web3, 340)

      const signerIdx = 0
      const signer = await election.validatorSignerAddressFromSet(signerIdx, 200)

      const lockedGold = await kit.contracts.getLockedGold()
      const validator = (await kit.web3.eth.getAccounts())[0]
      await kit.web3.eth.personal.unlockAccount(validator, '', 1000000)
      const balance0 = await lockedGold.getAccountTotalLockedGold(signer)
      console.info('start balance', balance0.toString(10))

      const header =
        '0x0100000000000084cd24f5a3be8f5306767c25e2ef565810f76b96887302a246462dfc7575ad4a7d8ea18220a731e942f3b5eaa5b3f47501000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000018cd5a25a914aabff56edb8f3c2b372aab17d8b60cb7fb12f499e09789dac460bbb49ef4045956dfd3556ce106510ff00000000000000000000000000000000017666574fd0dabcc4070e3e17872fbf42b08c1ca63f26f92e800bb8633e831587aa166361d53f9bedd6b442ecdfcb7e00000000000000000000000000000000018ad5019d546c0c3a9ba899096820f451c499822e258cd0196490d41fd6daa6ae47ffd0179ea27510f95dfcced104da00000000000000000000000000000000002365447a70a4de8b9f5d2763392846c85e4070d2cf86bf058ed15b9a326d5968c35d7418615d8b740f6203312efb27'
      const other =
        '0x0400000000000084e2ff5106f792bb53d97d035a7e9e7b4616acbb06b57a6a13d8cebd974a581e604bfeeb71ae78c46aa32f7fad4a325c000000000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000150a59f69a668f0079ad78ae7a1e01cbc39f0d2ecd8892cfa782b20e17346bbd7df5be2b62514a56ef552e52be3fae50000000000000000000000000000000000fd377f583f4b7f38eb25ded0b49f643cdbcb54277b25781268392acfdc6e3edb86432a628d387c90e9050ddea2512c000000000000000000000000000000000104a7e8519374e9b7efeff5efc366dea846a99ef63ae41185dd1b8e8f9d37457f77ce45665a8b3c5e4ce723ba6f7bfa0000000000000000000000000000000000a9925dc6319c010e4b15ca7cdde25c71dc30540aba2f7d991646a12a6c10ba97938efec9a574c426bbd8dc45908407'

      const tx = await slasher.slashSigner(signer, header, other)
      const txResult = await tx.send({ from: validator, gas: 5000000 })
      const txRcpt = await txResult.waitReceipt()
      console.info(txRcpt)
      assert.equal(txRcpt.status, true)

      // Penalty is defined to be 9000 cGLD in migrations, locked gold is 10000 cGLD for a validator, so after slashing locked gold is 1000cGld
      const balance = await lockedGold.getAccountTotalLockedGold(signer)
      console.info('end balance', balance.toString(10))
      // Gets also 2 rewards
      assert.equal(balance.toString(10), '3000000000000000000000')
    })
  })
})
