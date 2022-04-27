#!/usr/local/bin/node

/*
 * deploy-sdks script
 * THIS SCRIPT MUST BE RUN WITH NPM TO PUBLISH - `npm run deploy-sdks`
 * From the monorepo root run `npm run deploy-sdks`
 * You'll first be asked which version to update the sdks to.
 * You can pick major, minor, patch, a semantic version,
 * or nothing if you don't want to update the versions.
 * Then you'll be asked if you want to publish the sdks.
 * You can pick Y or N or dry-run for the same behavior as
 * `npm publish --dry-run`
 * The script will then update all the sdk packages accordingly
 * and attempt to publish them accordingly.
 * As 2FA is enabled for these packages you'll need to be ready
 * to enter 2FA codes as you are prompted.
 * (In a dry-run the 2FA codes can be anything)
 * If a package fails to update you will be prompted if you
 * want to retry.
 * You can pick Y or N.
 * Any sdk packages that are not published will be saved to
 * the `failedSDKs.json` file.
 * You will be asked to fix these packages and try again.
 * Then the script will exit.
 * If you run deploy-sdks and it detects a `failedSDKs.json`
 * file it will attempt again to publish those packages
 * (using the same version and possibly dry-run option) and
 * nothing else.
 * Once all packages are successfully deployed the script will
 * delete the `failedSDKs.json` file and update all other
 * packages in the monorepo that use any of the sdk packages
 * to use their `-dev` new version.
 */

import * as child_process from 'child_process'
import * as colors from 'colors'
import * as fs from 'fs'
import * as path from 'path'
import * as prompt from 'prompt'
import * as semver from 'semver'

const VERSIONS = ['major', 'minor', 'patch']
const dontOpen = ['node_modules', 'src', 'lib']
type PackageJson = {
  name: string
  version: string
  dependencies: { [key: string]: string }
  devDependencies: { [key: string]: string }
}

type Answers = {
  packages: string[]
  version: string
  publish: string
}

// This is an async IIFE so that we can use `aync/await`
;(async function () {
  prompt.start()

  // `getAnswers` will either prompt the user for a version and whether
  // or not to publish or it will use an existing failedSDKs.json file.
  const { packages, version, publish } = await getAnswers()

  if (version && !semver.valid(version) && !VERSIONS.includes(version)) {
    console.error(
      colors.red(
        'Invalid version given. Version must be major, minor, patch, or a semantic version.'
      )
    )
    process.exit(1)
  }

  const shouldPublish = publish === 'Y' || publish === 'dry-run'

  if (!shouldPublish && !version) {
    console.error(colors.red('Either a version or --publish must be given'))
    process.exit(1)
  }

  let tag = 'latest'
  const prerelease = semver.prerelease(version)
  if (prerelease) {
    tag = (prerelease[0] + '').trim()

    if (!['alpha', 'beta', 'canary', 'rc'].includes(tag)) {
      const errorPrompt = [
        {
          name: 'confirmTag',
          description: colors.red(
            `Unknown prerelease keyword given, do you really want to publish ${version} with tag ${tag}? Y/N`
          ),
        },
      ]
      const { confirmTag } = await prompt.get(errorPrompt)
      if (confirmTag !== 'Y') {
        process.exit(1)
      }
    }
  }

  const sdkPackagePaths = findPackagePaths(path.join(__dirname, '..', 'packages', 'sdk'))
  const sdkJsons: PackageJson[] = sdkPackagePaths.map((path) =>
    JSON.parse(fs.readFileSync(path).toString())
  )

  // We need all the sdkNames before we go through and update the
  // `package.json` dependencies.
  const sdkNames = sdkJsons.map(({ name }) => name)

  let newVersion: string
  // Here we update the sdk `package.json` objects with updated
  // versions and dependencies.
  sdkJsons.forEach((json, index) => {
    if (!newVersion) {
      if (!version) {
        newVersion = removeDevSuffix(json.version)
      } else {
        newVersion = VERSIONS.includes(version)
          ? incrementVersion(removeDevSuffix(json.version), version)
          : version
      }
    }

    json.version = newVersion

    if (shouldPublish) {
      for (const depName in json.dependencies) {
        if (sdkNames.includes(depName)) {
          json.dependencies[depName] = newVersion
        }
      }
      for (const depName in json.devDependencies) {
        if (sdkNames.includes(depName)) {
          json.devDependencies[depName] = newVersion
        }
      }
    }

    writePackageJson(sdkPackagePaths[index], json)
  })

  const otpPrompt = [
    {
      name: 'newOtp',
      description: colors.green(`Enter 2FA code`),
    },
  ]

  let successfulPackages = []
  let otp = ''
  if (shouldPublish) {
    // Here we build and publish all the sdk packages
    for (let index = 0; index < sdkPackagePaths.length; index++) {
      const path = sdkPackagePaths[index]
      const packageJson = sdkJsons[index]
      if (packages.length && !packages.includes(packageJson.name)) {
        console.log(`Skipping ${packageJson.name}`)
        successfulPackages.push(packageJson.name)
        continue
      }
      const packageFolderPath = path.replace('package.json', '')
      try {
        console.log(`Building ${packageJson.name}`)
        child_process.execSync('yarn build', { cwd: packageFolderPath, stdio: 'ignore' })

        console.info(`Publishing ${packageJson.name}@${packageJson.version} tagged as ${tag}...`)
        // Here you enter the 2FA code for npm
        let { newOtp } = (await prompt.get(otpPrompt)) as { newOtp: string }
        if (newOtp) {
          otp = newOtp
        } else {
          newOtp = otp
        }

        // Here is the actual publishing
        child_process.execSync(
          `npm publish --access public --otp ${newOtp} ${
            publish === 'dry-run' ? '--dry-run' : ''
          } --tag ${tag}`,
          { cwd: packageFolderPath, stdio: 'ignore' }
        )
        successfulPackages.push(packageJson.name)
      } catch (e) {
        const errorPrompt = [
          {
            name: 'retry',
            description: colors.red(
              `${packageJson.name} failed to publish. (Did you run 'yarn deploy-sdks'? must be run as 'npm run deploy-sdks') Error message: ${e.message} Retry? Y/N`
            ),
          },
        ]
        const { retry } = await prompt.get(errorPrompt)
        if (retry === 'Y') {
          index--
        }
      }
    }
  }

  // This means some packages were not successfully published
  // but some were published so we need to track the failed ones
  // to keep them in sync.
  if (successfulPackages.length && successfulPackages.length !== sdkNames.length) {
    const failedPackages = sdkNames.filter((sdkName) => !successfulPackages.includes(sdkName))
    console.error(
      colors.red(`The following SDK packages failed to publish ${failedPackages.join(', ')}.`)
    )
    console.error(colors.red('Creating failed packages file.'))
    fs.writeFileSync(
      path.join(__dirname, 'failedSDKs.json'),
      JSON.stringify({ packages: failedPackages, version: newVersion, publish })
    )
    console.error(colors.red(`Fix failed packages and try again.`))
    process.exit(1)
  }

  const failedJsonPath = path.join(__dirname, 'failedSDKs.json')
  if (fs.existsSync(failedJsonPath)) {
    fs.unlinkSync(failedJsonPath)
  }

  const allPackagePaths = findPackagePaths(path.join(__dirname, '..', 'packages'))

  const newDevVersion = getNewDevVersion(newVersion)
  // Finally we update all the packages across the monorepo
  // to use the most recent sdk packages.
  allPackagePaths.forEach((path) => {
    const json: PackageJson = JSON.parse(fs.readFileSync(path).toString())
    let packageChanged = false
    const isSdk = sdkNames.includes(json.name)

    if (isSdk) {
      json.version = `${newDevVersion}-dev`
      packageChanged = true
    }

    for (const depName in json.dependencies) {
      if (sdkNames.includes(depName)) {
        const versionUpdate =
          json.dependencies[depName].includes('-dev') || isSdk ? `${newDevVersion}-dev` : newVersion
        json.dependencies[depName] = versionUpdate
        packageChanged = true
      }
    }
    for (const depName in json.devDependencies) {
      if (sdkNames.includes(depName)) {
        const versionUpdate =
          json.devDependencies[depName].includes('-dev') || isSdk
            ? `${newDevVersion}-dev`
            : newVersion
        json.devDependencies[depName] = versionUpdate
        packageChanged = true
      }
    }
    if (packageChanged) {
      writePackageJson(path, json)
    }
  })
})()

async function getAnswers(): Promise<Answers> {
  try {
    const json = JSON.parse(
      fs.readFileSync(path.join(__dirname, 'failedSDKs.json')).toString()
    ) as Answers
    console.log(colors.green('Detected failed SDKs file. Attempting to republish failed SDKs.'))
    return json
  } catch (e) {
    const prompts = [
      {
        name: 'version',
        description: colors.green(
          `Specify a version: major, minor, patch, a semantic version number, or nothing`
        ),
      },
      {
        name: 'publish',
        description: colors.green(`Should the sdks also be published? Y/N/dry-run`),
      },
    ]
    const { version, publish } = (await prompt.get(prompts)) as { version: string; publish: string }
    return {
      version,
      publish,
      packages: [],
    }
  }
}

// Find package paths goes through the given directory and finds the relevant `package.json` files
function findPackagePaths(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce<string[]>((packageJsons, dirent) => {
    if (dirent.isDirectory() && !dontOpen.includes(dirent.name)) {
      return [...packageJsons, ...findPackagePaths(`${dir}/${dirent.name}`)]
    }
    if (dirent.name === 'package.json') {
      return [...packageJsons, path.join(dir, dirent.name)]
    }
    return packageJsons
  }, [])
}

function incrementVersion(version: string, command: string) {
  const index = VERSIONS.indexOf(command)
  return version
    .split('.')
    .map((v, i) => (i === index ? parseInt(v) + 1 : i > index ? 0 : v))
    .join('.')
}

function removeDevSuffix(version: string) {
  return version.endsWith('-dev') ? version.slice(0, -4) : version
}

function readPackageJson(filePath: string): PackageJson {
  return JSON.parse(fs.readFileSync(filePath).toString())
}

function writePackageJson(filePath: string, properties: Partial<PackageJson>) {
  const packageJson = readPackageJson(filePath)
  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        ...packageJson,
        ...properties,
      },
      null,
      2
    )
  )
}

function getNewDevVersion(version: string) {
  const versionArray = version.split('.')
  const bump = Number(versionArray[2]) + 1
  if (isNaN(bump)) return version
  versionArray[2] = `${bump}`
  return versionArray.join('.')
}
