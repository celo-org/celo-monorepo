// HTTP Cloud Function, triggered daily by Cloud Scheduler. Responds 500 on anything that
// needs a human, so the Scheduler job fails and the ERROR log entry can alert.
//
// Run directly, it runs the keeper once from a shell, configured like the function. It
// prints the result as JSON on the last line and exits 1 on anything that needs a human.
//
// Usage: node dist/index.js [--dry-run]
import { http } from '@google-cloud/functions-framework'
import { realpathSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { loadConfig, runKeeper } from './keeper.js'

// JSON lines that Cloud Logging parses into structured entries with a severity.
function info(message: string, fields?: Record<string, unknown>): void {
  console.log(JSON.stringify({ severity: 'INFO', message, ...fields }))
}

function error(message: string): void {
  console.error(JSON.stringify({ severity: 'ERROR', message }))
}

http('keeper', async (_req, res) => {
  try {
    res.json(await runKeeper(loadConfig(), info))
  } catch (e) {
    const message = `keeper: ${(e as Error).message}`
    error(message)
    res.status(500).send(message)
  }
})

const isMain =
  process.argv[1] !== undefined && realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  try {
    if (process.argv.includes('--dry-run')) process.env.DRY_RUN = 'true'
    console.log(JSON.stringify(await runKeeper(loadConfig(), info)))
  } catch (e) {
    error(`keeper: ${(e as Error).message}`)
    process.exitCode = 1
  }
}
