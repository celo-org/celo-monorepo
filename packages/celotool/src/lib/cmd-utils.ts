import { exec, spawn, SpawnOptions } from 'child_process'

export async function execCmdAndParseJson(
  cmd: string,
  execOptions: any = {},
  rejectWithOutput = false,
  pipeOutput = false
) {
  const [output] = await execCmd(cmd, execOptions, rejectWithOutput, pipeOutput)
  return JSON.parse(output)
}

// Returns a Promise which resolves to [stdout, stderr] array
export function execCmd(
  cmd: string,
  execOptions: any = {},
  rejectWithOutput = false,
  pipeOutput = false
): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    if (process.env.CELOTOOL_VERBOSE === 'true') {
      console.debug('$ ' + cmd)
      pipeOutput = true
    }

    exec(cmd, { maxBuffer: 1024 * 10000, ...execOptions }, (err, stdout, stderr) => {
      if (pipeOutput) {
        console.debug(stdout.toString())
      }
      if (err || pipeOutput) {
        console.error(stderr.toString())
      }
      if (err) {
        if (rejectWithOutput) {
          reject([err, stdout.toString(), stderr.toString()])
        } else {
          reject(err)
        }
      } else {
        resolve([stdout.toString(), stderr.toString()])
      }
    })
  })
}

export function spawnCmd(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  return new Promise<number | null>(async (resolve, reject) => {
    const { silent, ...spawnOptions } = options || { silent: false }
    if (!silent) {
      console.debug('$ ' + [cmd].concat(args).join(' '))
    }
    const process = spawn(cmd, args, { ...spawnOptions, stdio: silent ? 'ignore' : 'inherit' })
    process.on('close', (code) => {
      try {
        resolve(code)
      } catch (error) {
        reject(error)
      }
    })
  })
}

// Returns a Promise which resolves to [stdout, stderr] array
export function execCmdWithExitOnFailure(
  cmd: string,
  options: any = {},
  pipeOutput = false
): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    try {
      resolve(execCmd(cmd, options, false, pipeOutput))
    } catch (error) {
      console.error(error)
      process.exit(1)
      // To make the compiler happy.
      reject(error)
    }
  })
}

export async function spawnCmdWithExitOnFailure(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  const code = await spawnCmd(cmd, args, options)
  if (code !== 0) {
    console.error('spawnCmd failed for: ' + [cmd].concat(args).join(' '))
    process.exit(1)
  }
}

export function execBackgroundCmd(cmd: string) {
  if (process.env.CELOTOOL_VERBOSE === 'true') {
    console.debug('$ ' + cmd)
  }
  return exec(cmd, { maxBuffer: 1024 * 10000 }, (err, stdout, stderr) => {
    if (process.env.CELOTOOL_VERBOSE === 'true') {
      console.debug(stdout)
      console.error(stderr)
    }
    if (err) {
      console.error(err)
      process.exit(1)
    }
  })
}

export async function outputIncludes(cmd: string, matchString: string, matchMessage?: string) {
  const [stdout] = await execCmdWithExitOnFailure(cmd)
  if (stdout.includes(matchString)) {
    if (matchMessage) {
      console.info(matchMessage)
    }
    return true
  }
  return false
}
