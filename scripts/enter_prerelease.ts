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

  child_process.execSync(`git checkout -b prerelease/${branch}`)

  child_process.execSync(`git push origin prerelease/${branch}`)

  child_process.execSync(`git checkout -b ${branch}`)

  child_process.execSync(`yarn changeset pre enter ${tag}`)

  child_process.execSync(`git commit -am "chore: enter ${tag} prerelease"`)

  child_process.execSync(`git push origin prerelease/${branch}`)
})()
