import { Logging } from '@google-cloud/logging'

// See https://firebase.google.com/docs/functions/config-env
const ProjectID = process.env.GCLOUD_PROJECT || 'celo-faucet'

const logging = new Logging({
  projectId: ProjectID,
})
const log = logging.log('faucetMetrics')

const METADATA = {
  resource: {
    labels: {
      function_name: 'faucetMetrics',
      project_id: ProjectID,
      region: 'us-central1',
    },
    type: 'cloud_function',
  },
}

export enum ExecutionResult {
  Ok = 'Ok',
  /** Enqued Faucet Request has invalid type */
  InvalidRequestErr = 'InvalidRequestErr',
  /** Failed to obtain a free acount to faucet from */
  NoFreeAccountErr = 'NoFreeAccountErr',
  /** Faucet Action timed out */
  ActionTimedOutErr = 'ActionTimedOutErr',
  OtherErr = 'OtherErr',
}

/**
 * Sends an entry but doesn't block
 * (we don't want to block waiting for a metric to be sent)
 */
function noBlockingSendEntry(entryData: Record<string, any>) {
  const entry = log.entry(METADATA, entryData)
  log.write(entry).catch((err: any) => {
    console.error('EventLogger: error sending entry', err)
  })
}

export function logExecutionResult(snapKey: string, result: ExecutionResult) {
  noBlockingSendEntry({
    event: 'celo/faucet/result',
    executionResult: result,
    failed: result !== ExecutionResult.Ok,
    snapKey,
    message: `${snapKey}: Faucet result was ${result}`,
  })
}
