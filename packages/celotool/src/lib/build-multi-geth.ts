import fs from 'fs'
import { execCmdWithExitOnFailure } from 'src/lib/cmd-utils'

export async function buildImage(repo: string, base: string, tags: string[]): Promise<string> {
  const tag = `${base}-${tags.join('-')}`
  const dir = fs.mkdtempSync('/tmp/')

  const oldVersions = tags.map(a => `FROM us.gcr.io/celo-testnet/geth:${a}`).join('\n')
  const copy = tags.map((_, i) => `COPY --from=${i} /usr/local/bin/geth /usr/local/bin/geth-${i}`).join('\n')

  fs.writeFileSync(`${dir}/Dockerfile`, `${oldVersions}\nFROM us.gcr.io/celo-testnet/geth:${base}\n${copy}`)
  const cmd = `docker build . -t ${repo}-multi:${tag}`
  const res = await execCmdWithExitOnFailure(cmd, {cwd: dir})
  console.info(dir, cmd, res)
  const cmd2 = `docker push ${repo}-multi:${tag}`
  const res2 = await execCmdWithExitOnFailure(cmd2, {cwd: dir})
  console.info(cmd2, res2)
  return tag
}
