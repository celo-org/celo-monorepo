import { readFileSync, writeFileSync } from 'fs'
import { TypeDocOptionMap } from 'typedoc'

// TODO(yorke): make function package agnostic and move to `packages/utils`
const pkgName = 'contractkit'
const indent = '    '

const config: Partial<TypeDocOptionMap> = JSON.parse(readFileSync('./typedoc.json').toString())
const localSummaryPath = `${config.out!}/SUMMARY.md`
const localSummary = readFileSync(localSummaryPath).toString()
const localPathPrefix = config.out!.replace('../docs/', '')

const pathRegex = /\(.*.md\)/g
const modifiedLocalSummary = localSummary
  .replace(pathRegex, (match) => `(${localPathPrefix}/${match.slice(1, -1)})`)
  .replace(/\*/g, indent + '-')

const globalSummaryPath = '../docs/SUMMARY.md'
const globalSummary = readFileSync(globalSummaryPath).toString()

// Adding the indent to the tag, otherwise the markdows has poor preview
const startTag = `${indent}<!-- ${pkgName}-reference-start -->`
const endTag = `${indent}<!-- ${pkgName}-reference-end -->`

const modifiedGlobalSummary =
  globalSummary.slice(0, globalSummary.search(startTag) + startTag.length) +
  '\n' +
  modifiedLocalSummary +
  '\n' +
  globalSummary.slice(globalSummary.search(endTag))

writeFileSync(globalSummaryPath, modifiedGlobalSummary)

console.log(`${globalSummaryPath} updated with links to generated docs`)
