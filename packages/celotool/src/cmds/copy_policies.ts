import { switchToClusterFromEnv } from 'src/lib/cluster'
import {
  addCeloEnvMiddleware,
  CeloEnvArgv,
  envVar,
  fetchEnv,
  validateAndSwitchToEnv,
} from 'src/lib/env-utils'
import { deleteOtherPolicies, downloadPolicies, uploadPolicies } from 'src/lib/policies'
import yargs from 'yargs'

export const command = 'copy-policies'

export const describe =
  'command for copying stackdriver alerting policies from one environment to another'

interface CopyPoliciesArgv extends CeloEnvArgv {
  toEnv: string
  dryRun: boolean
}

export const builder = (argv: yargs.Argv) => {
  return addCeloEnvMiddleware(argv)
    .option('to-env', {
      type: 'string',
      description: 'Environment to which alert policies should be copied.',
      demand: 'Please specify an environment to copy the alert policies to.',
    })
    .option('dry-run', {
      describe: "Writes policies for env, but doesn't upload them",
      default: false,
      type: 'boolean',
    })
}

export const handler = async (argv: CopyPoliciesArgv) => {
  await switchToClusterFromEnv(false)

  try {
    // TODO(asa): Define Policy type.
    const fromPolicies: any[] = await downloadPolicies(argv.celoEnv)

    // Convert policies to be compatible with our target environment.
    const toPolicies: any[] = []
    const fromProject = fetchEnv(envVar.TESTNET_PROJECT_NAME)
    validateAndSwitchToEnv(argv.toEnv)
    await switchToClusterFromEnv(!argv.dryRun)
    const toNotificationChannelApplications = fetchEnv(
      envVar.STACKDRIVER_NOTIFICATION_CHANNEL_APPLICATIONS
    )
    const toNotificationChannelProtocol = fetchEnv(envVar.STACKDRIVER_NOTIFICATION_CHANNEL_PROTOCOL)
    const policyApplicationsPrefixs = fetchEnv(
      envVar.STACKDRIVER_NOTIFICATION_APPLICATIONS_PREFIX
    ).split(',')

    const toProject = fetchEnv(envVar.TESTNET_PROJECT_NAME)

    for (let policy of fromPolicies) {
      // Delete automatically generated fields per
      // https://cloud.google.com/monitoring/alerts/using-alerting-api#monitoring_alert_list_policies-gcloud
      delete policy.name
      delete policy.mutationRecord
      delete policy.creationRecord

      for (const condition of policy.conditions) {
        delete condition.name
      }

      // Search-replace env and project names.
      let policyString = JSON.stringify(policy, null, 2)
      policyString = policyString.split(argv.celoEnv).join(argv.toEnv)
      policyString = policyString.split(fromProject).join(toProject)
      policy = JSON.parse(policyString)

      // It's an Applications alert if displayName matches one of the prefixes specified by
      // STACKDRIVER_NOTIFICATION_APPLICATIONS_PREFIX. Otherwise Protocol.
      let toNotificationChannel = toNotificationChannelProtocol
      for (const prefix of policyApplicationsPrefixs) {
        if (policy.displayName.startsWith(prefix)) {
          toNotificationChannel = toNotificationChannelApplications
          break
        }
      }
      policy.notificationChannels = [
        `projects/${toProject}/notificationChannels/${toNotificationChannel}`,
      ]

      toPolicies.push(policy)
    }

    await uploadPolicies(argv.toEnv, toPolicies, argv.dryRun)
    await deleteOtherPolicies(argv.toEnv, toPolicies)
  } catch (error) {
    console.error(`Unable to copy alert policies from ${argv.celoEnv} to ${argv.toEnv}:\n${error}`)
    process.exit(1)
  }
}
