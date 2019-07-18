#!/usr/bin/env node
// tslint:disable:no-console
const execSync = require('child_process').execSync
const fs = require('fs')
const chalk = require('chalk')
const path = require('path')

function execCmd(cmd) {
  console.log('Running ==> ' + chalk.bold.cyan(cmd))
  execSync(cmd, { stdio: 'inherit' })
}

function isProduction(env) {
  return env.endsWith('production')
}

// TODO(asa): Use @google-cloud/storage, tar-stream to do all of this directly in node
function downloadContractArtifacts(gcsBucket, environment, outputDir) {
  console.debug(
    `Downloading contract artifacts from ${gcsBucket} to ${outputDir} for environment ${environment}`
  )
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  const projectPath = isProduction(environment)
    ? 'contract_artifacts_production'
    : 'contract_artifacts'

  execCmd(
    `curl https://www.googleapis.com/storage/v1/b/${projectPath}/o/${environment}?alt=media > ${environment}.tar.gz`
  )
  execCmd(`tar -zxf ${environment}.tar.gz --directory ${outputDir}`)
  execCmd(`rm ${environment}.tar.gz`)
}

function writeProxiedContractGetter(artifactDir, contractName, outputDir) {
  const artifact = JSON.parse(
    fs.readFileSync(path.join(artifactDir, `${contractName}.json`)).toString()
  )
  const proxyArtifact = JSON.parse(
    fs.readFileSync(path.join(artifactDir, `${contractName}Proxy.json`)).toString()
  )

  let proxyAddress
  for (let networkId in proxyArtifact.networks) {
    if (proxyArtifact.networks[networkId].address) {
      if (proxyAddress) {
        throw new Error(`Contract ${contractName} has multiple deployed addresses. Skipping`)
      }
      proxyAddress = proxyArtifact.networks[networkId].address
    }
  }

  if (!proxyAddress) {
    throw new Error(`Contract ${contractName}'s Proxy is missing a deployed address. Skipping`)
  }

  // TODO(asa): Use prettify to clean these up
  fs.writeFileSync(
    `${outputDir}/${contractName}.ts`,
    `import Web3 from 'web3'
import { ${contractName} as ${contractName}Type } from '../types/${contractName}'
export default async function getInstance(web3: Web3, account: string | null = null) {
  const contract = new web3.eth.Contract(${JSON.stringify(
    artifact.abi,
    null,
    2
  )}, "${proxyAddress}") as unknown as ${contractName}Type
  contract.options.from = account || (await web3.eth.getAccounts())[0]
  return contract
}
`
  )
}

function writeProxiedContractGetters(artifactDir, outputDir, environment) {
  downloadContractArtifacts('contract_artifacts', environment, artifactDir)
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir)
  }

  const jsonDir = path.join(artifactDir, `build/${environment}/contracts`)
  const proxiedContracts = fs
    .readdirSync(jsonDir)
    .filter((filename) => /\w+Proxy.json$/.test(filename))
    .map((proxyContractName) => proxyContractName.slice(0, -'Proxy.json'.length))

  // Create index file with exports for each contract
  const indexFilePath = `${outputDir}/index.ts`
  fs.writeFileSync(indexFilePath, '')

  proxiedContracts.map(function(contractName) {
    try {
      writeProxiedContractGetter(jsonDir, contractName, outputDir)
      fs.appendFileSync(
        indexFilePath,
        `export { default as ${contractName} } from './${contractName}';\n`
      )
    } catch (e) {
      console.log(`Error with ${contractName} proxy: `, e)
    }
  })
}

// TODO(asa): Require environment to be set or default to integration
const argv = require('minimist')(process.argv.slice(2))

function buildSdk() {
  try {
    const modulePath = path.dirname(__dirname)
    if (argv._.length === 0) {
      console.error('First argument should be the environment name')
      process.exit(1)
    }
    const network = argv._[0]
    const artifactsPath = path.join(modulePath, '.artifacts')
    const contractsPath = path.join(modulePath, './contracts')
    execCmd(`rm -rf ${path.join(artifactsPath, network)} ${path.join(contractsPath)}`)
    writeProxiedContractGetters(artifactsPath, contractsPath, network)
    const contractArtifactsPattern = path.join(
      modulePath,
      '.artifacts/build/',
      network,
      'contracts/*.json'
    )
    execCmd(
      `yarn run --cwd="${modulePath}" typechain --target="web3-1.0.0" --outDir=types "${contractArtifactsPattern}"`
    )

    // Necessary to copy types to the lib folder so the contracts have the same path to them.
    execCmd(`mkdir -p ${__dirname}/../lib/types`)
    execCmd(`cp ${__dirname}/../types/* ${__dirname}/../lib/types/`)

    writeNetworkNameToFile(network, contractsPath)

    console.debug('Recompiling typescript')
    execCmd(`yarn run --cwd="${__dirname}/.." compile-typescript`)
    console.debug('build-sdk done')
  } catch (error) {
    console.error('Error building SDK', error)
    process.exit(1)
  }
}

function writeNetworkNameToFile(networkName, contractsDirPath) {
  const fileName = path.join(contractsDirPath, 'network-name.ts')
  console.debug(`Writing ${networkName} to ${fileName}`)
  const fd = fs.openSync(fileName, 'w')
  fs.writeSync(fd, `export const NETWORK_NAME='${networkName}'\n`)
}

buildSdk()
