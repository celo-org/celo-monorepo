import {
  deleteOtherPolicies,
  downloadPolicies,
  uploadPolicies,
} from '@celo/celotool/src/lib/policies'
import {
  addCeloEnvMiddleware,
  CeloEnvArgv,
  envVar,
  fetchEnv,
  validateAndSwitchToEnv,
} from '@celo/celotool/src/lib/utils'
import { switchToClusterFromEnv } from 'src/lib/cluster'
import * as yargs from 'yargs'

export const command = 'copy-policies'

export const describe =
  'command for copying stackdriver alerting policies from one environment to another'

interface CopyPoliciesArgv extends CeloEnvArgv {
  toEnv: string
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv).option('to-env', {
    type: 'string',
    description: 'Environment to which alert policies should be copied.',
    demand: 'Please specify an environment to copy the alert policies to.',
  })
}

export const handler = async (argv: CopyPoliciesArgv) => {
  await switchToClusterFromEnv(false)

  try {
    // TODO(asa): Define Policy type.
    const fromPolicies: any[] = await downloadPolicies(argv.celoEnv)

    // Convert policies to be compatible with our target environment.
    const toPolicies: any[] = []
    const fromNotificationChannel = fetchEnv(envVar.STACKDRIVER_NOTIFICATION_CHANNEL)
    const fromProject = fetchEnv(envVar.TESTNET_PROJECT_NAME)
    validateAndSwitchToEnv(argv.toEnv)
    await switchToClusterFromEnv(true)
    const toNotificationChannel = fetchEnv(envVar.STACKDRIVER_NOTIFICATION_CHANNEL)
    const toProject = fetchEnv(envVar.TESTNET_PROJECT_NAME)

    for (const policy of fromPolicies) {
      // Delete automatically generated fields per
      // https://cloud.google.com/monitoring/alerts/using-alerting-api#monitoring_alert_list_policies-gcloud
      delete policy.name
      delete policy.mutationRecord
      delete policy.creationRecord

      for (const condition of policy.conditions) {
        delete condition.name
      }

      let policyString = JSON.stringify(policy, null, 2)
      policyString = policyString.split(argv.celoEnv).join(argv.toEnv)
      policyString = policyString.split(fromNotificationChannel).join(toNotificationChannel)
      policyString = policyString.split(fromProject).join(toProject)
      toPolicies.push(JSON.parse(policyString))
    }

    await uploadPolicies(argv.toEnv, toPolicies)
    await deleteOtherPolicies(argv.toEnv, toPolicies)
  } catch (error) {
    console.error(`Unable to copy alert policies from ${argv.celoEnv} to ${argv.toEnv}:\n${error}`)
    process.exit(1)
  }
}
