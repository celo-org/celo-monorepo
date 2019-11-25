#!/usr/bin/env ts-node

import program from 'commander'
import fs from 'fs-extra'

import {
  GethTestConfig,
  initAndStartGeth,
  migrateContracts,
  startGeth,
  writeGenesis,
} from '../e2e-tests/utils'

import {
  AccountType,
  getPrivateKeysFor,
  getValidators,
  privateKeyToPublicKey,
} from '../lib/generate_utils'
import { getEnodeAddress } from '../lib/geth'

program
  .option('-g, --geth-repo <path>', 'Geth repo path')
  .option('-v, --validators <number>', 'Number of validators', '3')
  .option('-m, --migrations <number>', 'Number of migrations to be executed', '19')
  .option(
    '-w, --mnemonic <words>',
    'Mnemonic seed words',
    'jazz ripple brown cloth door bridge pen danger deer thumb cable prepare negative library vast'
  )
  .option('-k, --keep-data', 'Skeps the clean up of the previous node data', '/tmp/e2e')
  .option('--test-dir <path>', 'Path to temporal data directory', '/tmp/e2e')
  .action(() => {
    const { gethRepo, validators, migrations, mnemonic, keepData, testDir } = program

    main({
      gethRepo,
      validators: +validators,
      migrations: +migrations,
      mnemonic,
      keepData,
      testDir,
    })
  })
  .parse(process.argv)

async function main({
  gethRepo: gethRepoPath,
  validators: numValidators,
  migrations: migrateTo,
  mnemonic,
  keepData,
  testDir: tmpDir,
}: {
  gethRepo: string
  validators: number
  migrations: number
  mnemonic: string
  keepData: boolean
  testDir: string
}) {
  const ethstats = 'localhost:3000'
  const numEthstats = +numValidators
  const gethConfig: GethTestConfig = {
    migrateTo,
    instances: [...Array(numValidators).keys()].map((key: number) => {
      return {
        name: `${key}-validator`,
        validating: true,
        syncmode: 'full',
        port: 30303 + key,
        rpcport: 8545 + key * 2,
        wsport: 8546 + key * 2,
        ethstats: key >= numEthstats ? '' : ethstats,
      }
    }),
  }
  const genesisPath = `${tmpDir}/genesis.json`
  const validatorsFilePath = `${tmpDir}/validators.json`
  const validatorInstances = gethConfig.instances.filter((x: any) => x.validating)
  const validatorPrivateKeys = getPrivateKeysFor(AccountType.VALIDATOR, mnemonic, numValidators)
  const attestationKeys = getPrivateKeysFor(AccountType.ATTESTATION, mnemonic, numValidators)
  const validators = getValidators(mnemonic, numValidators)
  const validatorEnodes = validatorPrivateKeys.map((x: any, i: number) =>
    getEnodeAddress(privateKeyToPublicKey(x), '127.0.0.1', validatorInstances[i].port)
  )
  const gethBinaryPath = `${gethRepoPath}/build/bin/geth`

  if (!keepData) {
    fs.removeSync(tmpDir)
  }
  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir)
  }

  if (migrateTo) {
    console.log('writing genesis')
    await writeGenesis(validators, genesisPath)
    console.log('wrote   genesis')
  }

  console.log(validatorEnodes)

  fs.writeFileSync(validatorsFilePath, JSON.stringify(validatorEnodes), 'utf8')

  let validatorIndex = 0
  for (const instance of gethConfig.instances) {
    if (instance.validating) {
      // Automatically connect validator nodes to eachother.
      const otherValidators = validatorEnodes.filter((_: string, i: number) => i !== validatorIndex)
      instance.peers = (instance.peers || []).concat(otherValidators)
      instance.privateKey = instance.privateKey || validatorPrivateKeys[validatorIndex]
      validatorIndex++
    }
    if (gethConfig.migrate || gethConfig.migrateTo) {
      await initAndStartGeth(gethBinaryPath, instance)
    } else {
      await startGeth(gethBinaryPath, instance)
    }
  }
  if (gethConfig.migrate || gethConfig.migrateTo) {
    await migrateContracts(
      validatorPrivateKeys,
      attestationKeys,
      validators.map((v) => v.address),
      gethConfig.migrateTo
    )
  }
}
