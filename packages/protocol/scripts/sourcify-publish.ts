/* tslint:disable no-console */
import FormData from 'form-data'
import fs from 'fs'
import fetch from 'node-fetch'
import path from 'path'

/*
 * A script that reads the artifacts from the build/contracts directory and publish using the sourcify api.
 *
 * Expects the following flags:
 *   network: The network for which artifacts should be
 *
 * Run using yarn run sourcify-publish, e.g.:
 * yarn run sourcify-publish \
 *   --network alfajores --buildArtifacts ./build/contracts
 */

const _buildTargets = {
  network: undefined,
  buildArtifacts: undefined,
}

async function main(buildTargets: typeof _buildTargets) {
  const artifactBasePath = buildTargets.buildArtifacts || './build/contracts'
  const artifactPaths = fs.readdirSync(artifactBasePath)
  const network = buildTargets.network

  console.log('Uploading sources & metadata')
  console.log('============================')
  console.log(artifactPaths)

  for (const _path of artifactPaths) {
    const artifact = require(path.join(process.cwd(), artifactBasePath, _path))

    console.log()
    console.log(artifact.contractName)
    console.log('-'.repeat(artifact.contractName.length))

    const chainId = Object.keys(artifact.networks)[0]
    const address = artifact.networks[chainId].address

    const formData = new FormData()
    formData.append('files', fs.createReadStream(artifactBasePath + '/' + _path))
    formData.append('address', address)
    formData.append('chain', chainId)

    await fetch('https://sourcify.dev/server', {
      method: 'POST',
      body: formData,
    })
      .then((res) => res.json())
      .then((json) =>
        fetch(
          `https://${network}-blockscout.celo-testnet.org/address/${json.result[0].address}/contracts`
        )
      )
  }
  console.log('Finished.')
}

const minimist = require('minimist')
const argv = minimist(process.argv.slice(2), {
  string: Object.keys(_buildTargets),
})

main(argv)
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err)
    process.exit(1)
  })
