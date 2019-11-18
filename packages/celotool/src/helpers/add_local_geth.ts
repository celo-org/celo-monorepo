#!/usr/bin/env ts-node

import program from 'commander'
import fs from 'fs'
import { findAPortNotInUse } from 'portscanner'

import { GethTestConfig, initAndStartGeth, addStaticPeers } from '../e2e-tests/utils'

import { AccountType, getPrivateKeysFor, privateKeyToPublicKey } from '../lib/generate_utils'
import { getEnodeAddress } from '../lib/geth'

program
  .option('-g, --geth-repo <path>', 'Geth repo path')
  .option('-v, --validator', 'Is validator')
  .option('--no-eth-start', 'Skip adition of ethStats')
  .option(
    '-w, --mnemonic <words>',
    'Mnemonic seed words',
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'
  )
  .option('--test-dir <path>', 'Path to temporal data directory', '/tmp/e2e')
  .action(() => {
    const { gethRepo, validator, noEthStats, mnemonic, testDir } = program

    main({
      gethRepo,
      validator,
      noEthStats,
      mnemonic,
      testDir,
    })
  })
  .parse(process.argv)

async function main({
  gethRepo: gethRepoPath,
  validator,
  noEthStats,
  mnemonic: mnemonic,
  testDir: tmpDir,
}: {
  gethRepo: string
  validator: boolean
  noEthStats: boolean
  mnemonic: string
  testDir: string
}) {
  let key = (await findAPortNotInUse(30303)) - 30303

  const ethstats = 'localhost:3000'
  const gethConfig: GethTestConfig = {
    instances: [
      {
        name: `validator-${key}`,
        validating: validator,
        syncmode: 'full',
        port: 30303 + key,
        rpcport: 8545 + key * 2,
        wsport: 8546 + key * 2,
        ethstats: noEthStats ? '' : ethstats,
      },
    ],
  }

  const instance = gethConfig.instances[0]

  const validatorsFilePath = `${tmpDir}/validators.json`
  const validatorEnodes = JSON.parse(fs.readFileSync(validatorsFilePath, 'utf8'))

  const validatorPrivateKey =
    instance.privateKey || getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, key).pop()
  const validatorEnode = getEnodeAddress(
    privateKeyToPublicKey(validatorPrivateKey as string),
    '127.0.0.1',
    instance.port
  )

  const gethBinaryPath = `${gethRepoPath}/build/bin/geth`

  instance.peers = (instance.peers || []).concat(validatorEnodes)
  instance.privateKey = validatorPrivateKey

  const enodes = [...validatorEnodes, validatorEnode].filter((_, i, list) => list.indexOf(_) === i)

  fs.writeFileSync(validatorsFilePath, JSON.stringify(enodes), 'utf8')

  while (key-- > 0) {
    await addStaticPeers(
      `${tmpDir}/validator-${key}/datadir`,
      enodes.filter((_, i: number) => i !== key)
    )
  }

  await initAndStartGeth(gethBinaryPath, instance)
}
