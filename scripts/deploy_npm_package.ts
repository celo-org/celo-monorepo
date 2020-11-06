import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { prompt } from 'prompts'
import { execCmd } from '../packages/celotool/lib/lib/cmd-utils'

enum ReleaseType {
  MAJOR = 'major',
  MINOR = 'minor',
  PATCH = 'patch',
}

const dependencyGraph = JSON.parse(
  readFileSync(join(__dirname, '..', 'dependency-graph.json')).toString()
)

const deployablePackages = ['@celo/contractkit', '@celo/utils', '@celo/celocli', '@celo/base']

const rootDir = join(__dirname, '..')
const getPackageDir = (packageName: string) => join(rootDir, dependencyGraph[packageName].location)

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
  return hash.trim()
}

const switchToBranch = async (branch: string): Promise<void> => {
  await execCmd(`git checkout ${branch}`, {}, true).catch(async ([, , stdErr]) => {
    if (stdErr.startsWith('error: pathspec')) {
      await execCmd(`git checkout -b ${branch}`)
    }
  })
}

async function main() {
  const [dirtyFiles] = await execCmd('git status -s')
  if (dirtyFiles) {
    console.warn(
      'Untracked changes in working tree, aborting. This is a destructive script and work could be lost.'
    )
    // return: TODO: uncomment me
  }

  const { packageName, networks } = await prompt([
    {
      type: 'select',
      name: 'packageName',
      choices: deployablePackages.map((pkg) => ({ title: pkg, value: pkg })),
      message: 'Which package would you like to deploy?',
    },
    {
      type: 'multiselect',
      name: 'networks',
      message: 'Which networks would you like to tag this release for?',
      choices: ['alfajores', 'baklava', 'rc1'].map((network) => ({
        title: network,
        value: network,
      })),
    },
  ])

  const currentCommit = await getCurrentCommit()
  const packageJson = readPackageJson(packageName)

  const releaseBranch = `releases/${packageName}/${packageJson.version}`

  await switchToBranch(releaseBranch)

  // make new package.json and test installation
  // look at each dependency, verify we're happy to deploy with this commit
  const dependencies = Object.keys(packageJson.dependencies).filter((name) =>
    name.startsWith('@celo')
  )

  let celoDependencyVersions = {}
  for (const dep of dependencies) {
    const depPackageJson = readPackageJson(dep)
    console.log(dep)
    const latestPublishedVersion = await execCmd('npm view . version', {
      cwd: getPackageDir(dep),
    }).then(([stdout]) => stdout.trim())

    if (latestPublishedVersion !== depPackageJson.version) {
      console.log(
        `Local version of ${dep} is ${depPackageJson.version}, but latest published is ${latestPublishedVersion}`
      )
      console.log(`Sort out this discrepancy to ensure they match before continuing`)
      return
    }

    celoDependencyVersions = { ...celoDependencyVersions, [dep]: latestPublishedVersion }
  }

  updatePackageJson(packageName, 'dependencies', celoDependencyVersions)

  const installWorks = await confirm(`Verify docker installation works. Run the following in another terminal to verify:
    
celo-monorepo $ docker run --rm -v $PWD/${dependencyGraph[packageName].location}:/tmp/npm_package -it --entrypoint bash node:10
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install /tmp/npm_package/
    
all OK?`)
  if (!installWorks) {
    return reset(currentCommit)
  }

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
  await execCmd(`git add ${getPackageDir(packageName)}`)
  await execCmd(`git commit -m "Update ${packageName} to v${packageJson.version}
  
shasum: ${shasum}"`)
  await execCmd(`git push origin ${releaseBranch}`)

  await execCmd(`yarn publish --public ${packageName}-${packageJson.version}.tgz`, {
    cwd: getPackageDir(packageName),
  })

  const remoteInstallWorks = await confirm(`Verify remote installation works, run the following in another terminal to verify:

celo-monorepo $ docker run --rm -it --entrypoint bash node:10
root@e0d56700584f:/# mkdir /tmp/tmp1 && cd /tmp/tmp1
root@e0d56700584f:/tmp/tmp1# npm install ${packageName}@${packageJson.version}
  
all OK?`)
  if (!remoteInstallWorks) {
    console.warn(
      `Seems like we've released a broken version of ${packageName}, fix up any problems and redeploy.`
    )
    return
  }

  const newCommit = await getCurrentCommit()
  for (const tag of [...networks, 'latest', newCommit]) {
    console.log(`npm dist-tag add ${packageName}@${packageJson.version} ${tag}`)
    await execCmd(`npm dist-tag add ${packageName}@${packageJson.version} ${tag}`, {
      cwd: getPackageDir(packageName),
    })
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
