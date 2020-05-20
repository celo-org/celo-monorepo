import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { prompt } from 'prompts'
import { execCmd } from '../packages/celotool/lib/lib/cmd-utils'
import { packageNameToDirectory } from './dependency-graph-utils'

enum ReleaseType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
}

const deployablePackages = ['@celo/contractkit', '@celo/utils', '@celo/celocli']

const rootDir = join(__dirname, '..')
const packagesDir = join(rootDir, 'packages')
const getPackageDir = (packageName: string) =>
  join(packagesDir, packageNameToDirectory[packageName])

const reset = (commitHash: string) => execCmd(`git reset ${commitHash} --hard`)

function readPackageJson(packageName: string): { [x: string]: any } {
  const packageJsonPath = join(getPackageDir(packageName), 'package.json')
  return JSON.parse(readFileSync(packageJsonPath).toString())
}

function updatePackageJson(packageName: string, property: string, value: any) {
  const packageJsonPath = join(getPackageDir(packageName), 'package.json')
  const packageJson = JSON.parse(readFileSync(packageJsonPath).toString())
  const updated =
    typeof value === 'object'
      ? // todo: this won't be sorted...
        { ...packageJson, [property]: { ...packageJson[property], ...value } }
      : { ...packageJson, [property]: value }
  writeFileSync(packageJsonPath, JSON.stringify(updated, null, 2))
}

const confirm = async (message: string): Promise<boolean> => {
  const { value } = await prompt({
    type: 'confirm',
    name: 'value',
    message,
  })
  return value
}

const getCurrentCommit = async (): Promise<string> => {
  const [hash] = await execCmd('git rev-parse HEAD')
  return hash
}

async function main() {
  const [dirtyFiles] = await execCmd('git status -s')
  if (dirtyFiles) {
    console.warn(
      'Untracked changes in working tree, aborting. This is a destructive script and work could be lost.'
    )
    return
  }

  const { packageName, version, networks } = await prompt([
    {
      type: 'select',
      name: 'packageName',
      choices: deployablePackages.map((pkg) => ({ title: pkg, value: pkg })),
      message: 'Which package would you like to deploy?',
    },
    {
      type: 'select',
      message: 'Is this a major, minor or patch release?',
      choices: Object.values(ReleaseType).map((type) => ({ title: type, value: type })),
      name: 'version',
    },
    {
      type: 'multiselect',
      name: 'networks',
      message: 'Which networks would you like to tag this release for?',
      choices: ['alfajores', 'integration', 'baklava'].map((network) => ({
        title: network,
        value: network,
      })),
    },
  ])

  const currentCommit = await getCurrentCommit()

  const packageJson = readPackageJson(packageName)
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
  updatePackageJson(packageName, 'version', newVersion)

  // make new package.json and test installation
  // look at each dependency, verify we're happy to deploy with this commit
  const dependencies = Object.keys(packageJson.dependencies).filter((name) =>
    name.startsWith('@celo')
  )
  let celoDependencyVersions = {}
  for (const dep of dependencies) {
    const depPackageJson = readPackageJson(dep)
    const latestPublishedVersion = await execCmd('npm view . version', {
      cwd: getPackageDir(dep),
    }).then(([stdout]) => stdout.trim())
    const [distTagsResponse] = await execCmd('npm view . dist-tags --json', {
      cwd: getPackageDir(packageName),
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
    const [commitsSinceLastRelease] = await execCmd(
      `git log --pretty=oneline ${lastTagCommitHash}..HEAD ./packages/${packageNameToDirectory[packageName]}`,
      {
        cwd: rootDir,
      }
    )
    const ok = await confirm(
      `Dependencies: local version of ${dep} is ${depPackageJson.version} (${
        commitsSinceLastRelease.split('\n').length
      } commits since last release), latest published version is ${latestPublishedVersion}`
    )
    if (!ok) {
      console.log('Please deploy', dep, 'before trying to deploy', packageName)
      return
    }
    celoDependencyVersions = { ...celoDependencyVersions, [dep]: latestPublishedVersion }
  }

  updatePackageJson(packageName, 'dependencies', celoDependencyVersions)

  const installWorks = await confirm(`Verify docker installation works. Run the following in another terminal to verify:
    
celo-monorepo $ docker run --rm -v $PWD/packages/${packageNameToDirectory[packageName]}:/tmp/npm_package -it --entrypoint bash node:10
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install /tmp/npm_package/
    
all OK?`)
  if (!installWorks) {
    return reset(currentCommit)
  }

  const releaseBranch = `release/${packageName}-${newVersion}`
  await execCmd(`git checkout -b ${releaseBranch}`)

  updatePackageJson(packageName, 'version', newVersion)
  const [packStdOut, packStdErr] = await execCmd('npm pack', {
    cwd: getPackageDir(packageName),
  })
  const shasumLine = packStdErr.split('\n').find((line) => line.match(/shasum/))
  if (!shasumLine) {
    console.log('Unable to get shasum from "npm pack" output')
    console.log(packStdOut, packStdErr)
    return reset(currentCommit)
  }
  const shasum = shasumLine.split(' ').pop()

  await execCmd(`yarn publish --public ${packageName}-${newVersion}.tgz`, {
    cwd: getPackageDir(packageName),
  })

  const remoteInstallWorks = await confirm(`Verify remote installation works, run the following in another terminal to verify:

celo-monorepo $ docker run --rm -it --entrypoint bash node:10
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install ${packageName}@${newVersion}
  
all OK?`)
  if (!remoteInstallWorks) {
    console.warn(
      `Seems like we've released a broken version of ${packageName}, fix up any problems and redeploy.`
    )
    return
  }

  // the package json we need to push will only have an updated version field... not dependencies
  updatePackageJson(
    packageName,
    'dependencies',
    Object.keys(celoDependencyVersions).reduce(
      (accum, cur) => ({ ...accum, [cur]: `file:../${packageNameToDirectory[cur]}` }),
      {}
    )
  )
  await execCmd(`git add ./packages/${packageNameToDirectory[packageName]}`)
  await execCmd(`git commit -m "Update ${packageName} to v${newVersion}
  
shasum: ${shasum}"`)

  const newCommit = await getCurrentCommit()

  await Promise.all(
    [...networks, 'latest', newCommit].map((tag) =>
      execCmd(`npm dist-tag add ${packageName}@${packageJson.version} ${newCommit}`, {
        cwd: getPackageDir(packageName),
      })
    )
  )
  await execCmd(`git push origin ${releaseBranch}`)

  console.log(packageName, 'released!')
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
