import { BigNumber } from 'bignumber.js'

import { CURRENCY_ENUM } from '@celo/utils'

import { NETWORK_NAME } from '../contracts/network-name'
import ContractUtils from '../src/contract-utils-v2'
import { Logger, LogLevel } from '../src/logger'
import { makeReportTx } from '../src/oracle'
import { NULL_ADDRESS } from '../src/sortedlinkedlist'
import { Web3Utils } from '../src/web3-utils'
import { getIpAddressOfTxnNode, getMiner0AccountAddress, getMiner0PrivateKey } from '../test/utils'

beforeAll(() => {
  Logger.setLogLevel(LogLevel.VERBOSE)
})

describe('Oracle', () => {
  describe('#makeReportTx', () => {
    it('Should construct report tx correctly', async () => {
      jest.setTimeout(25 * 1000)
      const oraclePrivKey = getMiner0PrivateKey(NETWORK_NAME)
      const oracleAddress = getMiner0AccountAddress(NETWORK_NAME)

      const txNodeIp = await getIpAddressOfTxnNode(NETWORK_NAME)
      const web3 = await Web3Utils.getWeb3WithSigningAbility('http', txNodeIp, 8545, oraclePrivKey)

      const tokenAddress = await ContractUtils.getAddressForCurrencyContract(
        web3,
        CURRENCY_ENUM.DOLLAR
      )

      const rateNum = new BigNumber(10)
      const rateDenom = new BigNumber(1)
      const tx = await makeReportTx(web3, oracleAddress, tokenAddress, rateNum, rateDenom)
      expect(tx.arguments).toStrictEqual([
        tokenAddress,
        rateNum.toString(),
        rateDenom.toString(),
        NULL_ADDRESS,
        NULL_ADDRESS,
      ])
    })
  })
})
