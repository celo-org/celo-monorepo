import { exec, spawn, SpawnOptions } from 'child_process'

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

    const execProcess = exec(
      cmd,
      { maxBuffer: 1024 * 10000, ...execOptions },
      (err, stdout, stderr) => {
        if (process.env.CELOTOOL_VERBOSE === 'true') {
          console.debug(stdout.toString())
        }
        if (err || process.env.CELOTOOL_VERBOSE === 'true') {
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
      }
    )

    if (pipeOutput) {
      if (execProcess.stdout) {
        execProcess.stdout.pipe(process.stdout)
      }
      if (execProcess.stderr) {
        execProcess.stderr.pipe(process.stderr)
      }
    }
  })
}

export function spawnCmd(
  cmd: string,
  args: string[],
  options?: SpawnOptions & { silent?: boolean }
) {
  return new Promise<number>(async (resolve, reject) => {
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
  options: any = {}
): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    try {
      resolve(execCmd(cmd, options))
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
