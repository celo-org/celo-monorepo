import { assertEqualBN, exec } from '@celo/protocol/lib/test-utils'
import BN from 'bn.js'
import chai from 'chai'
import { readFileSync, writeFileSync } from 'fs-extra'
import { ReleaseGoldContract, ReleaseGoldMultiSigContract, ReleaseGoldProxyContract } from 'types'
const assert = chai.assert
chai.config.showDiff = true

const DEVELOPMENT_FROM = '0x5409ed021d9299bf6814279a6a1411a7e866a631'
const ONE_ADDRESS = '0x0000000000000000000000000000000000000001'
const removeFile = async (filePath: string) => exec('sh', ['-c', `rm ${filePath} || true`])

let ReleaseGoldMultiSig: ReleaseGoldMultiSigContract
let ReleaseGold: ReleaseGoldContract
let ReleaseGoldProxy: ReleaseGoldProxyContract

module.exports = async (callback: (error?: any) => number) => {
  ReleaseGoldMultiSig = artifacts.require('ReleaseGoldMultiSig')
  ReleaseGold = artifacts.require('ReleaseGold')
  ReleaseGoldProxy = artifacts.require('ReleaseGoldProxy')

  const grant = [
    {
      identifier: DEVELOPMENT_FROM,
      beneficiary: ONE_ADDRESS,
      releaseStartTime: '1/1/2020',
      releaseCliffTime: 31536000,
      numReleasePeriods: 48,
      releasePeriod: 2628000,
      amountReleasedPerPeriod: '10',
      revocable: true,
      releaseOwner: DEVELOPMENT_FROM,
      refundAddress: DEVELOPMENT_FROM,
      subjectToLiquidityProvision: false,
      initialDistributionRatio: 1000,
      canValidate: false,
      canVote: true,
    },
  ]
  const grantPath = '/tmp/grant.json'
  const deployedGrantsPath = '/tmp/deployedGrants.json'
  const outputPath = '/tmp/output'

  writeFileSync(grantPath, JSON.stringify(grant))
  await removeFile(deployedGrantsPath)
  await removeFile(outputPath)

  const deployArgs = [
    '-n development',
    `-f ${DEVELOPMENT_FROM}`,
    `-g ${grantPath}`,
    `-d ${deployedGrantsPath}`,
    `-o ${outputPath}`,
    `-r yes`,
  ]

  try {
    await exec('sh', ['-c', './scripts/bash/deploy_release_contracts.sh ' + deployArgs.join(' ')])
    const outputFile = JSON.parse(readFileSync(outputPath).toString())
    const deployedGrant = outputFile[0]

    const multiSig = await ReleaseGoldMultiSig.at(deployedGrant.MultiSigProxyAddress)

    console.log(await multiSig.getOwners())
    assert(
      (await multiSig.getOwners()) === [DEVELOPMENT_FROM, ONE_ADDRESS],
      'multisig owners are different'
    )

    assertEqualBN(
      await web3.eth.getBalance(deployedGrant.ContractAddress),
      new BN(480).mul(new BN(10).pow(new BN(18))),
      'contract does not have the right balance'
    )

    const releaseGoldProxyContract = await ReleaseGoldProxy.at(deployedGrant.ContractAddress)
    const implementationAddress = await releaseGoldProxyContract._getImplementation()

    const releaseGoldImplementationContract = await ReleaseGold.at(implementationAddress)

    assert(
      (await releaseGoldImplementationContract.initialized()) === true,
      'ReleaseGold implementation is not yet initialized'
    )

    assert(1 === 1 + 1, 'test assertion')
  } catch (error) {
    console.error('Error doing release contract deployment')
    console.error(error)
    callback(error)
    process.exit(1)
  }
  callback()
}
