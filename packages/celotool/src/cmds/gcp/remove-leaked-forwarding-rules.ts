import { zip } from 'lodash'
import { execCmd, execCmdWithExitOnFailure } from 'src/lib/cmd-utils'
import yargs from 'yargs'

export const command = 'remove-leaked-forwarding-rules'

export const describe = 'Removes leaked forwarding rules that Kubernetes did not garbage collect'

interface Argv extends yargs.Argv {
  keywords: string
  project: string
}

export const builder = (argv: yargs.Argv) => {
  return argv
    .option('keywords', {
      required: false,
      default: '',
      type: 'string',
      description: 'comma-separated list of keywords when matched with the rule, should be deleted',
    })
    .option('project', {
      alias: 'p',
      required: true,
      type: 'string',
      description: 'GCP project within which to run this command',
    })
}

export const handler = async (argv: Argv) => {
  console.info('Fetching forwarding-rules')
  let rules: any[] = await execCmdWithExitOnFailure(
    `gcloud compute forwarding-rules list --format=json --project=${argv.project}`
  ).then(([body]) => JSON.parse(body))

  const candidates = rules.filter((rule) => rule.target && rule.target.includes('targetPools'))

  console.info('Determining health of rules')
  const shouldDelete = await Promise.all(
    candidates.map(async (rule) => {
      const targetComponents = rule.target.split('/')
      const zone = targetComponents[8]
      const target = targetComponents[10]

      try {
        await execCmd(
          `gcloud compute target-pools get-health ${target} --region=${zone} --format=json --project=${argv.project}`,
          {},
          true
        )
        return false
      } catch ([error, stdout, stderr]) {
        const healthyInstances = JSON.parse(stdout).length
        return healthyInstances === 0
      }
    })
  )

  const candidatesToDelete = zip(candidates, shouldDelete).filter(([, x]) => x)
  console.info(
    `Should delete ${candidatesToDelete.length} forwarding-rules that don't have any targets`
  )

  await Promise.all(
    candidatesToDelete.map(async ([candidate]) => {
      const targetComponents = candidate.target.split('/')
      const zone = targetComponents[8]
      const target = targetComponents[10]

      console.info(`Deleting forwarding-rule ${candidate.name}`)
      await execCmdWithExitOnFailure(
        `gcloud compute forwarding-rules delete ${candidate.name} ${getRegionFlag(
          candidate.selfLink
        )} -q --project=${argv.project}`
      )
      console.info(`Deleted forwarding-rule ${candidate.name}`)

      console.info(`Deleting target-pool ${target}`)
      await execCmdWithExitOnFailure(
        `gcloud compute target-pools delete ${target} --region=${zone} -q --project=${argv.project}`
      )
      console.info(`Deleted target-pool ${target}`)
    })
  )

  if (argv.keywords.length === 0) {
    console.info(`No keywords given`)
    return
  }

  const keywordsToMatch = argv.keywords.split(',')

  rules = await execCmdWithExitOnFailure(
    `gcloud compute forwarding-rules list --format=json --project=${argv.project}`
  ).then(([body]) => JSON.parse(body))

  const matchingRules = rules.filter((lb) =>
    keywordsToMatch.some(
      (keyword) => lb.description.includes(keyword) || lb.target.includes(keyword)
    )
  )

  await Promise.all(
    matchingRules.map(async (rule) => {
      console.info(`Deleting forwarding-rule ${rule.name}`)
      await execCmdWithExitOnFailure(
        `gcloud compute forwarding-rules delete ${rule.name} ${getRegionFlag(
          rule.selfLink
        )} -q --project=${argv.project}`
      )
      console.info(`Deleted forwarding-rule ${rule.name}`)
    })
  )

  return
}

function getRegionFlag(name: string) {
  const parts = name.split('/')
  const regionIndicator = parts[7]
  return regionIndicator === 'global' ? '--global' : `--region=${parts[8]}`
}
