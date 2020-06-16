import { execCmd } from '@celo/celotool/src/lib/cmd-utils'
import { createHash } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { join, relative } from 'path'

export const DEP_GRAPH_FILENAME = 'dependency-graph.json'
const repositoryRoot = join(__dirname, '..')

export interface DependencyGraph {
  [x: string]: {
    location: string
    dependencies: string[]
  }
}

interface LernaDependency {
  name: string
  version: string
  location: string
  private: boolean
}

const parseLernaOutput = (
  lernaGraph: { [x: string]: string[] },
  lernaDependencies: LernaDependency[]
): DependencyGraph => {
  return lernaDependencies.reduce(
    (accum, { name, location: absPath }) => ({
      ...accum,
      [name]: {
        location: relative(repositoryRoot, absPath),
        dependencies: lernaGraph[name]
          .filter((packageName) => packageName.startsWith('@celo'))
          .filter((packageName) => Boolean(lernaGraph[packageName])), // some @celo packages aren't in the monorepo
      },
    }),
    {}
  )
}

const buildGraph = async (): Promise<string> => {
  const [lernaGraph, dependencies] = (
    await Promise.all([
      execCmd('yarn --silent lerna ls --graph --all'),
      execCmd('yarn --silent lerna ls --json --all'),
    ])
  ).map(([stdout]) => JSON.parse(stdout))

  const dependencyGraph = parseLernaOutput(lernaGraph, dependencies)
  return JSON.stringify(dependencyGraph, null, 2)
}

const hash = (input: string): string =>
  createHash('SHA256')
    .update(input)
    .digest('base64')

export const graphHasChanged = async (): Promise<boolean> => {
  const oldGraph = readFileSync(DEP_GRAPH_FILENAME).toString()
  const newGraph = await buildGraph()

  return hash(oldGraph) !== hash(newGraph)
}

export const updateGraph = async () => {
  const graph = await buildGraph()
  writeFileSync(DEP_GRAPH_FILENAME, graph)
}
