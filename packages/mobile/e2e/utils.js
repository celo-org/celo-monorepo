const childProcess = require('child_process')

function exec(command, options = { cwd: process.cwd() }) {
  return new Promise((resolve, reject) => {
    childProcess.exec(command, { ...options }, (err, stdout, stderr) => {
      if (err) {
        err.stdout = stdout
        err.stderr = stderr
        reject(err)
        return
      }

      resolve({ stdout, stderr })
    })
  })
}
export const DEFAULT_PIN = '123456'

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function skipTo(nextScreen) {
  const testID = `ButtonSkipTo${nextScreen}`
  try {
    await waitFor(element(by.id(testID)))
      .toBeVisible()
      .withTimeout(1000)
    await element(by.id(testID)).tap()
  } catch (error) {
    throw error
  }
}

export function enterPin() {
  setTimeout(() => {
    exec('adb shell input text 123456 && sleep 1 && adb shell input keyevent 66')
  }, 3000)
}
