import { readFileSync, writeFileSync } from 'fs'
import { TypeDocOptionMap } from 'typedoc'

const pkgName = process.argv.slice(2)[0]
if (!pkgName) {
  console.error('No package name given.')
  process.exit(1)
}
const indent = '    '

const config: Partial<TypeDocOptionMap> = JSON.parse(readFileSync('./typedoc.json').toString())
const localSummaryPath = `${config.out!}/SUMMARY.md`
const localSummary = readFileSync(localSummaryPath).toString()

const filePathPrefix = pkgName.indexOf('wallet') >= 0 ? '../../../docs/' : '../../docs/'
const localPathPrefix = config.out!.replace(filePathPrefix, '')

const pathRegex = /\(.*.md\)/g
const modifiedLocalSummary = localSummary
  .replace(pathRegex, (match) => `(${localPathPrefix}/${match.slice(1, -1)})`)
  .replace(/\*/g, indent + '-')

const globalSummaryPath = filePathPrefix + 'SUMMARY.md'
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
