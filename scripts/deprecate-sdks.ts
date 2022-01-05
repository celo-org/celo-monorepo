import * as fs from 'fs'
import * as path from 'path'
import * as prompt from 'prompt'
import * as colors from 'colors'
import * as child_process from 'child_process'
import * as semver from 'semver'

type PackageJson = {
  name: string
  version: string
  dependencies: { [key: string]: string }
  devDependencies: { [key: string]: string }
}

const dontOpen = ['node_modules', 'src', 'lib']

;(async function () {
  prompt.start()
  const prompts = [
    {
      name: 'version',
      description: colors.green('Which sdk version do you want to deprecate?'),
    },
    {
      name: 'message',
      description: colors.green('Reason for deprecation:'),
    },
  ]
  const { version, message } = (await prompt.get(prompts)) as { version: string; message: string }
  if (!semver.valid(version)) {
    console.error(colors.red('Invalid version'))
    process.exit(1)
  }
  const sdkPackagePaths = findPackagePaths(path.join(__dirname, '..', 'packages', 'sdk'))
  const sdkJsons: PackageJson[] = sdkPackagePaths.map((path) =>
    JSON.parse(fs.readFileSync(path).toString())
  )
  const otpPrompt = [
    {
      name: 'newOtp',
      description: colors.green(`Enter 2FA code`),
    },
  ]

  let otp = ''
  for (const sdkJson of sdkJsons) {
    let { newOtp } = (await prompt.get(otpPrompt)) as { newOtp: string }
    if (!newOtp) {
      newOtp = otp
    } else {
      otp = newOtp
    }
    const buffer = child_process.execSync(`npm info ${sdkJson.name} versions --json`)
    const versions = JSON.parse(buffer.toString()) as string[]
    if (!versions.includes(version)) {
      console.log(colors.yellow(`Version ${version} does not exist for ${sdkJson.name}.`))
    } else {
      try {
        child_process.execSync(
          `npm deprecate ${sdkJson.name}@${version} '${message}' --otp ${newOtp}`
        )
        console.log(colors.green(`${sdkJson.name}@${version} deprecated with message ${message}`))
      } catch (e) {
        console.error(colors.red(`${sdkJson.name} failed to deprecate version ${version}.`))
        console.error(e)
      }
    }
  }
})()

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
