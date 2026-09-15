import * as child_process from 'child_process'
import * as fs from 'fs'
import * as path from 'path'

// Matches `import "./x.sol";` and `import { A } from "../y.sol";`
const IMPORT_PATH_REGEXP = /import\s+(?:[^'";]*?\s+from\s+)?['"]([^'"]+)['"]/g

/**
 * Where each staged subtree of the `@celo/contracts` package comes from in the repo.
 * `stagedDir` is relative to the package root ('' for the root itself), `sourceDir` is
 * relative to the protocol root.
 */
export interface StagedTree {
  stagedDir: string
  sourceDir: string
}

export interface UnresolvedImport {
  file: string
  importPath: string
}

/**
 * Rewrites relative imports of the staged sources for the published layout.
 *
 * In the repo the source trees sit side by side under the protocol root, so a frozen
 * 0.5 source reaches a shared interface through `../../contracts/...`. The package
 * flattens `contracts/` onto its root and puts `contracts-0.5/` under `0.5/`, so each
 * such import is resolved against the file's original location, mapped to the
 * staged location of its target and re-expressed relative to the staged file.
 * Imports that leave the trees altogether (git submodules, node modules) are left
 * as they are; the publish guard reports them.
 */
export function rewriteImportsForPackageLayout(
  packageDir: string,
  protocolRoot: string,
  trees: StagedTree[]
): void {
  const root = path.resolve(packageDir)
  const byDepth = [...trees].sort((a, b) => b.stagedDir.length - a.stagedDir.length)
  for (const file of listSolidityFiles(root)) {
    const stagedRelative = path.relative(root, file)
    const tree = byDepth.find((t) => isInside(stagedRelative, t.stagedDir))
    if (!tree) {
      continue
    }
    const originalFile = path.join(
      protocolRoot,
      tree.sourceDir,
      path.relative(tree.stagedDir, stagedRelative)
    )
    const source = fs.readFileSync(file, 'utf8')
    const rewritten = source.replace(IMPORT_PATH_REGEXP, (statement, importPath: string) => {
      if (!importPath.startsWith('.')) {
        return statement
      }
      const originalTarget = path.resolve(path.dirname(originalFile), importPath)
      const targetInRepo = path.relative(protocolRoot, originalTarget)
      const targetTree = trees.find((t) => isInside(targetInRepo, t.sourceDir))
      if (!targetTree) {
        return statement
      }
      const stagedTarget = path.join(
        root,
        targetTree.stagedDir,
        path.relative(targetTree.sourceDir, targetInRepo)
      )
      const relative = toPosix(path.relative(path.dirname(file), stagedTarget))
      const newImportPath = relative.startsWith('.') ? relative : `./${relative}`
      return statement.replace(importPath, newImportPath)
    })
    if (rewritten !== source) {
      fs.writeFileSync(file, rewritten)
    }
  }
}

/**
 * Writes a stub at `stubDir/<path>` for every Solidity file under `sourceDir/<path>`,
 * so that an import path from an earlier package layout keeps resolving. A stub is a
 * file with the same pragma that only imports the moved source; it is skipped where a
 * real file already exists at the stub's path, and files under `excludeDirs` (relative
 * to `sourceDir`) are not stubbed.
 */
export function writeCompatibilityStubs(
  packageDir: string,
  sourceDir: string,
  stubDir: string,
  excludeDirs: string[]
): void {
  const root = path.resolve(packageDir)
  const sourceRoot = path.join(root, sourceDir)
  for (const file of listSolidityFiles(sourceRoot)) {
    const relative = path.relative(sourceRoot, file)
    if (excludeDirs.some((dir) => isInside(relative, dir))) {
      continue
    }
    const stub = path.join(root, stubDir, relative)
    if (fs.existsSync(stub)) {
      continue
    }
    const pragma = fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .find((line) => line.startsWith('pragma solidity'))
    if (!pragma) {
      continue
    }
    const importPath = toPosix(path.relative(path.dirname(stub), file))
    fs.mkdirSync(path.dirname(stub), { recursive: true })
    fs.writeFileSync(
      stub,
      [
        '// SPDX-License-Identifier: LGPL-3.0-only',
        pragma,
        '',
        `// Compatibility path: the source now lives at ${toPosix(path.relative(root, file))}.`,
        `import "${importPath.startsWith('.') ? importPath : './' + importPath}";`,
        '',
      ].join('\n')
    )
  }
}

/**
 * Relative imports of the published files must resolve to files that are published
 * too. Nothing compiles the staged tree before `npm publish`, so a dangling import
 * would otherwise only surface in a consumer's build. Bare imports
 * (`@openzeppelin/...`) are left to the consumer's own dependency setup.
 *
 * `publishedFiles` limits the check to what npm will actually ship (see
 * publishedSolidityFiles); without it every Solidity file under the package is checked.
 */
export function findUnresolvedRelativeImports(
  packageDir: string,
  publishedFiles?: string[]
): UnresolvedImport[] {
  const root = path.resolve(packageDir)
  const files = publishedFiles
    ? publishedFiles.map((f) => path.join(root, f)).filter((f) => f.endsWith('.sol'))
    : listSolidityFiles(root)
  const published = new Set(files)
  const unresolved: UnresolvedImport[] = []
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8')
    for (const importPath of relativeImportsOf(source)) {
      const target = path.resolve(path.dirname(file), importPath)
      if (!published.has(target) || !fs.existsSync(target)) {
        unresolved.push({ file: path.relative(root, file), importPath })
      }
    }
  }
  return unresolved
}

export function assertStagedImportsResolve(packageDir: string, publishedFiles?: string[]): void {
  const unresolved = findUnresolvedRelativeImports(packageDir, publishedFiles)
  if (unresolved.length === 0) {
    return
  }
  const lines = unresolved.map(({ file, importPath }) => `  ${file}: ${importPath}`)
  throw new Error(
    `Staged contracts package has imports that do not resolve inside the package:\n${lines.join(
      '\n'
    )}`
  )
}

/** The files `npm publish` would ship from the staged package, honoring .npmignore. */
export function publishedSolidityFiles(packageDir: string): string[] {
  const output = child_process.execSync('npm pack --dry-run --json --ignore-scripts', {
    cwd: packageDir,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  const [pack] = JSON.parse(output.toString()) as { files: { path: string }[] }[]
  return pack.files.map((f) => f.path).filter((f) => f.endsWith('.sol'))
}

function relativeImportsOf(source: string): string[] {
  const found: string[] = []
  IMPORT_PATH_REGEXP.lastIndex = 0
  let match = IMPORT_PATH_REGEXP.exec(source)
  while (match !== null) {
    if (match[1].startsWith('.')) {
      found.push(match[1])
    }
    match = IMPORT_PATH_REGEXP.exec(source)
  }
  return found
}

function isInside(relativePath: string, dir: string): boolean {
  if (dir === '') {
    return !relativePath.startsWith('..')
  }
  return relativePath === dir || relativePath.startsWith(dir + path.sep)
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/')
}

function listSolidityFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).reduce((files, entry) => {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return files.concat(listSolidityFiles(entryPath))
    }
    return entry.name.endsWith('.sol') ? files.concat(entryPath) : files
  }, [] as string[])
}
