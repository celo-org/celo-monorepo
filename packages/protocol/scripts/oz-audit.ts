import { exec } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { parse } from 'node-html-parser'

const html = readFileSync(
  '/Users/yorhodes/Downloads/Private Report August 25 – OpenZeppelin blog.htm',
  'utf8'
)
const root = parse(html)
const text = root.structuredText

const phases = text.split('Vulnerabilities').slice(1)

const po = {}
phases.forEach((phase, i) => {
  const c = phase.indexOf('Critical')
  const h = phase.indexOf('High')
  const m = phase.indexOf('Medium')
  const l = phase.indexOf('Low')
  const n = phase.indexOf('Notes')
  const e = phase.indexOf('Conclusions')

  const critical = phase.substring(c, h)
  const high = phase.substring(h, m)
  const medium = phase.substring(m, l)
  const low = phase.substring(l, n)
  const notes = phase.substring(n, e)

  const sections = [critical, high, medium, low, notes]

  const o = {}
  sections.forEach((section) => {
    const [header, ...issues] = section.split('[')
    o[header.trim()] = issues
      .map((s) => '[' + s)
      .map((issue) => {
        const t = issue.indexOf('\n')
        return {
          title: issue.substring(0, t),
          body: issue.substring(t + 1),
        }
      })
  })

  po[`phase ${i + 1}`] = o
})

const REPO = 'celo-org/celo-labs'
const LABELS = 'oz-audit'

const phase4issues = po['phase 3']
const createIssues = [...phase4issues.Low, ...phase4issues.Medium]

createIssues.forEach((i) =>
  exec(
    `gh issue create --repo ${REPO} --label ${LABELS} --title \"${i.title}\" --body \"${i.body}\"`,
    (e) => (e ? console.log(e) : null)
  )
)

writeFileSync('output.json', JSON.stringify(po, null, 2))
