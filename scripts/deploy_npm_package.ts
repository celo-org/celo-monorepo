import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { prompt } from 'prompts'
import { execCmd } from '../packages/celotool/lib/lib/cmd-utils'
import { packageNameToDirectory } from './dependency-graph-utils'

enum ReleaseType {
  MAJOR = 'patch',
  MINOR = 'minor',
  PATCH = 'major',
}

const deployablePackages = [
  '@celo/contractkit',
  '@celo/utils',
  '@celo/celocli',
  'alexbhs-publish-test',
]

const revert = (commitHash: string) => {
  console.log('> reverting to', commitHash)
}

function readPackageJson(dir: string): { [x: string]: any } {
  const packageJsonPath = join(__dirname, '..', 'packages', dir, 'package.json')
  return JSON.parse(readFileSync(packageJsonPath).toString())
}

function updatePackageJson(packageDir: string, property: string, value: any) {
  const packageJsonPath = join(__dirname, '..', 'packages', packageDir, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath).toString())
  const updated =
    typeof value === 'object'
      ? { ...packageJson, [property]: { ...packageJson[property], ...value } }
      : { ...packageJson, [property]: value }
  writeFileSync(packageJsonPath, JSON.stringify(updated, null, 2))
}

async function main() {
  const [dirtyFiles] = await execCmd('git status -s')
  if (dirtyFiles) {
    // console.warn(
    //   'Untracked changes in working tree, aborting. This is a descructive script and work could be lost.'
    // )
    // process.exit(1)
  }

  const response = await prompt([
    {
      type: 'select',
      name: 'packageName',
      choices: deployablePackages,
      message: 'Which package would you like to deploy?',
    },
    {
      type: 'list',
      message: 'Is this a major, minor or patch release?',
      choices: Object.values(ReleaseType),
      name: 'version',
    },
  ])
  const { packageName, version } = response
  console.log(packageName, version)
  const packageDir = packageNameToDirectory[packageName]

  const [currentCommit] = await execCmd('git rev-parse HEAD', {
    cwd: join(__dirname, '..', 'packages', packageDir),
  })
  const packageJsonPath = join(__dirname, '..', 'packages', packageDir, 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath).toString())
  const currentVersion = packageJson.version
  let [major, minor, patch] = currentVersion.split('.').map(Number)
  if (version === ReleaseType.MAJOR) {
    major++
  } else if (version === ReleaseType.MINOR) {
    minor++
  } else {
    patch++
  }
  const newVersion = [major, minor, patch].map(String).join('.')
  updatePackageJson(packageDir, 'version', newVersion)

  // make new package.json and test installation
  // look at each dependency, verify we're happy to deploy with this commit
  const dependencies = Object.keys(packageJson.dependencies).filter((name) =>
    name.startsWith('@celo')
  )
  let celoDependencyVersions = {}
  for (const dep of dependencies) {
    const depPackageJson = readPackageJson(packageNameToDirectory[dep])
    const latestPublishedVersion = await execCmd('npm view . version', {
      cwd: join(__dirname, '..', 'packages', packageNameToDirectory[dep]),
    }).then(([stdout]) => stdout.trim())
    const [distTagsResponse] = await execCmd('npm view . dist-tags --json', {
      cwd: join(__dirname, '..', 'packages', packageNameToDirectory[dep]),
    })
    const found = Object.entries(JSON.parse(distTagsResponse)).find(
      ([hash, tag]) => hash.length === 40 && tag === latestPublishedVersion.trim()
    )
    if (!found) {
      // we don't have an associated commit
      const { ok } = await prompt({
        type: 'confirm',
        name: 'ok',
        message: `Dependencies: local version of ${dep} is ${depPackageJson.version}, latest published is ${latestPublishedVersion}. OK?`,
      })
      if (!ok) {
        console.log('Please deploy', dep, 'before trying to deploy', packageName)
        return
      }
      celoDependencyVersions = { ...celoDependencyVersions, [dep]: latestPublishedVersion }
      continue
    }

    const [lastTagCommitHash] = found
    const [
      commitsSinceLastRelease,
    ] = await execCmd(
      `git log --pretty=oneline ${lastTagCommitHash}..HEAD ./packages/${packageNameToDirectory[dep]}`,
      { cwd: join(__dirname, '..') }
    )
    const { ok } = await prompt({
      type: 'confirm',
      name: 'ok',
      message: `Dependencies: local version of ${dep} is ${depPackageJson.version} (${
        commitsSinceLastRelease.split('\n').length
      } commits since last release), latest published version is ${latestPublishedVersion}`,
    })
    if (!ok) {
      console.log('Please deploy', dep, 'before trying to deploy', packageName)
      return
    }
    celoDependencyVersions = { ...celoDependencyVersions, [dep]: latestPublishedVersion }
  }

  updatePackageJson(packageDir, 'dependencies', celoDependencyVersions)

  console.log('> versions to overwrite', celoDependencyVersions)

  const { installWorks } = await prompt({
    type: 'confirm',
    name: 'installWorks',
    message: `Verify docker installation works. Run the following in another terminal to verify:
    
celo-monorepo $ docker run --rm -v $PWD/packages/${packageDir}:/tmp/npm_package -it --entrypoint bash node:10
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install /tmp/npm_package/
    
all OK?`,
  })
  if (!installWorks) {
    revert(currentCommit)
  }

  const [packStdOut, packStdErr] = await execCmd('npm pack', {
    cwd: join(__dirname, '..', 'packages', packageDir),
  })
  const shasumLine = packStdErr.split('\n').find((line) => line.match(/shasum/))
  if (!shasumLine) {
    console.log('Unable to get shasum from "npm pack" output')
    console.log(packStdOut, packStdErr)
    return
  }

  await execCmd(`yarn publish --public ${packageName}-${newVersion}.tar.gz`, {
    cwd: join(__dirname, '..', 'packages', packageDir),
  })

  const { remoteInstallWorks } = await prompt({
    type: 'confirm',
    name: 'remoteInstallWorks',
    message: `Verify remote installation works, run the following in another terminal to verify:

celo-monorepo $ docker run --rm -it --entrypoint bash node:10
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install ${packageName}@${newVersion}
  
all OK?`,
  })
  if (!remoteInstallWorks) {
    console.warn(
      `Seems like we've released a broken version of ${packageName}, fix up any problems and redeploy.`
    )
    return
  }

  await execCmd(`npm dist-tag add ${packageName}@${packageJson.version} ${'what goes here...'}`, {
    cwd: join(__dirname, '..', 'packages', packageDir),
  })
  await execCmd(`npm dist-tag add ${packageName}@${packageJson.version} ${'network'}`, {
    cwd: join(__dirname, '..', 'packages', packageDir),
  })
  await execCmd(`npm dist-tag add ${packageName}@${packageJson.version} latest`, {
    cwd: join(__dirname, '..', 'packages', packageDir),
  })

  // the package json we need to push will only have an updated version field... not dependencies
  await execCmd('git stash')

  const shasum = shasumLine.split(' ').pop()
  const releaseBranch = `release/${packageName}-${newVersion}`
  await execCmd(`git checkout -b ${releaseBranch}`)
  updatePackageJson(packageDir, 'version', newVersion)
  await execCmd(`git add ${packageJsonPath}`)
  await execCmd(`git commit -m "Update ${packageName} to v${newVersion}

shasum: ${shasum}"`)
  await execCmd(`git push origin ${releaseBranch}`)

  console.log(packageName, 'released!')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
