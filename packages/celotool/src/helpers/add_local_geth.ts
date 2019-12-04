#!/usr/bin/env ts-node

import program from 'commander'
import fs from 'fs'
import { findAPortNotInUse } from 'portscanner'

import { AccountType, getPrivateKeysFor, privateKeyToPublicKey } from '../lib/generate_utils'
import { getEnodeAddress, GethInstanceConfig, GethRunConfig, initAndStartGeth } from '../lib/geth'

program
  .option('-g, --geth-repo <path>', 'Geth repo path')
  .option('-v, --validator', 'Is validator')
  .option('-x, --proxy', 'Add a proxy')
  .option('--no-eth-start', 'Skip adition of ethStats')
  .option(
    '-w, --mnemonic <words>',
    'Mnemonic seed words',
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'
  )
  .option('--test-dir <path>', 'Path to temporal data directory', '/tmp/e2e')
  .action(() => {
    const { gethRepo, validator, proxy, noEthStats, mnemonic, testDir } = program

    main({
      gethRepo,
      validator,
      proxy,
      noEthStats,
      mnemonic,
      testDir,
    })
  })
  .parse(process.argv)

async function main({
  gethRepo: gethRepoPath,
  validator,
  proxy: isProxy,
  noEthStats,
  mnemonic: mnemonic,
  testDir: tmpDir,
}: {
  gethRepo: string
  validator: boolean
  proxy: boolean
  noEthStats: boolean
  mnemonic: string
  testDir: string
}) {
  const key = (await findAPortNotInUse(30303)) - 30303
  const proxyKey = key + 1

  const ethstats = 'localhost:3000'
  const gethConfig: GethRunConfig = {
    gethRepoPath: '../../../celo-blockchain',
    runPath: tmpDir,
    network: 'local',
    networkId: 1101,
    instances: [],
  }

  gethConfig.instances = [
    {
      gethRunConfig: gethConfig,
      name: `${key}-validator`,
      validating: validator,
      syncmode: 'full',
      port: 30303 + key,
      rpcport: 8545 + key * 2,
      wsport: 8546 + key * 2,
      ethstats: noEthStats ? '' : ethstats,
      isProxied: isProxy,
      proxy: isProxy ? '${proxyKey}-proxy' : undefined,
    },
  ]

  const instance: GethInstanceConfig = gethConfig.instances[0]
  let proxyInstance: GethInstanceConfig = {} as any

  const validatorsFilePath = `${tmpDir}/validators.json`
  const validatorEnodes = JSON.parse(fs.readFileSync(validatorsFilePath, 'utf8'))

  const validatorPrivateKey =
    instance.privateKey || getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, key).pop()
  const validatorEnode = getEnodeAddress(
    privateKeyToPublicKey(validatorPrivateKey as string),
    '127.0.0.1',
    instance.port
  )

  instance.privateKey = validatorPrivateKey
  instance.proxies = [validatorEnode, validatorEnode]

  let proxyEnode: string = ''

  if (isProxy) {
    const validatorPrivateKey = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, key).pop()

    proxyEnode = getEnodeAddress(
      privateKeyToPublicKey(getPrivateKeysFor(
        AccountType.PROXY,
        mnemonic,
        proxyKey
      ).pop() as string),
      '127.0.0.1',
      instance.port
    )
    proxyInstance = {
      gethRunConfig: gethConfig,
      name: `${proxyKey}-proxy`,
      validating: false,
      syncmode: 'full',
      port: 30303 + proxyKey,
      proxyport: 30303 + proxyKey + 1,
      rpcport: 8545 + proxyKey * 2,
      wsport: 8546 + proxyKey * 2,
      isProxy: true,
      proxiedValidatorAddress: privateKeyToPublicKey(validatorPrivateKey as string).slice(-40),
      // proxiedValidatorAddress: validatorEnode,
      // proxiedValidatorAddress:`127.0.0.1:${instance.port}`,
    } as GethInstanceConfig
    gethConfig.instances.unshift(proxyInstance)
  }

  const gethBinaryPath = `${gethRepoPath}/build/bin/geth`

  instance.privateKey = validatorPrivateKey

  if (isProxy) {
    proxyInstance.peers = validatorEnodes
    instance.peers = [proxyEnode]
  } else {
    instance.peers = validatorEnodes
  }

  for (const i of gethConfig.instances) {
    await initAndStartGeth(gethBinaryPath, i, true)
    await new Promise((_) => setTimeout(_, 1000))
  }

  console.log()
  console.log(`Node RPC port: ${instance.rpcport}`)
  if (isProxy) {
    console.log(`Proxy RPC port: ${gethConfig.instances[0].rpcport}`)
  }
}
