import child_process from 'child_process'
import colors from 'colors'
import prompt from 'prompt'
;(async function () {
  prompt.start()
  const prompts = [
    {
      name: 'branch',
      description: colors.green(
        'Specify a name for branch. It will be used as prerelease/YOUR_STRING'
      ),
    },
    {
      name: 'tag',
      description: colors.green('Specify beta or alpha'),
    },
  ]
  const { branch, tag } = (await prompt.get(prompts)) as { branch: string; tag: string }

  const BASE = `prerelease/${branch}`

  const WORKING_BRANCH = `prerelease-wip/${branch}`

  child_process.execSync(`git checkout -b ${BASE}`)

  child_process.execSync(`git push origin ${BASE}`)

  child_process.execSync(`git checkout -b ${WORKING_BRANCH}`)

  child_process.execSync(`yarn changeset pre enter ${tag}`)

  child_process.execSync(`git add .changeset/pre.json`)

  child_process.execSync(`git commit am "chore: enter ${tag} prerelease"`)

  child_process.execSync(`git push origin ${BASE}`)

  child_process.execSync(
    `echo 'Any prs merged into ${BASE} will trigger the opening of a ${tag} Versioning PR being opened automatically. Merge that branch to publish'`
  )
})()
