import { spawn, SpawnOptions } from 'child_process'
import cmdExists from 'command-exists'

export function execCmd(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  return new Promise<number>((resolve, reject) => {
    const { silent, ...spawnOptions } = options || { silent: false }
    if (!silent) {
      console.debug('$ ' + [cmd].concat(args).join(' '))
    }
    const process = spawn(cmd, args, {
      ...spawnOptions,
      stdio: silent ? 'ignore' : 'inherit',
    })
    process.on('close', (code) => {
      try {
        resolve(code)
      } catch (error) {
        reject(error)
      }
    })
  })
}

export async function execWith0Exit(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  try {
    return (await execCmd(cmd, args, options)) === 0
  } catch (error) {
    return false
  }
}

export async function execCmdWithError(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  const code = await execCmd(cmd, args, options)
  if (code !== 0) {
    throw new Error(`"${cmd} ${args.join(' ')}" exited ${code}`)
  }
}

export async function commandExists(command: string) {
  return cmdExists(command)
}
