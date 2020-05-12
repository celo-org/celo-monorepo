import { execCmd } from '@celo/celotool/src/lib/cmd-utils'
import { createHash } from 'crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const packagesDirectory = join(__dirname, '..', 'packages')
export const filename = 'dependency-graph.json'

// Easier to operate on folder names of packages rather than the name
// from the package.json file. People are more familiar with folder names as well
function getDirectoryFromPackageName(): { [x: string]: string } {
  const folders: { [x: string]: string } = {}
  const allPackages = readdirSync(packagesDirectory)
  allPackages.forEach((pkg) => {
    const packageJsonPath = join(packagesDirectory, pkg, 'package.json')
    if (existsSync(packageJsonPath)) {
      const { name } = JSON.parse(
        readFileSync(join(packagesDirectory, pkg, 'package.json')).toString()
      )
      folders[name] = pkg
    }
  })

  return folders
}
const packageNameToDirectory = getDirectoryFromPackageName()

const parseLernaOutput = (raw: string) => {
  const fullGraph: { [k: string]: string[] } = JSON.parse(raw)
  return Object.entries(fullGraph).reduce(
    (accum, [packageName, dependencies]) => ({
      ...accum,
      [packageNameToDirectory[packageName]]: dependencies
        .filter((name) => name.startsWith('@celo'))
        .map((pkg) => packageNameToDirectory[pkg])
        .filter((name) => Boolean(name)), // some @celo packages aren't in the monorepo
    }),
    {}
  )
}

const buildGraph = async (): Promise<string> => {
  const [rawResult] = await execCmd('yarn --silent lerna ls --graph --all')
  const graph = parseLernaOutput(rawResult)
  return JSON.stringify(graph, null, 2)
}

const hash = (input: string): string =>
  createHash('SHA256')
    .update(input)
    .digest('base64')

export const graphHasChanged = async (): Promise<boolean> => {
  const oldGraph = readFileSync(filename).toString()
  const newGraph = await buildGraph()

  return hash(oldGraph) !== hash(newGraph)
}

export const updateGraph = async () => {
  const graph = await buildGraph()
  writeFileSync(filename, graph)
}
