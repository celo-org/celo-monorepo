import {
  findUnresolvedRelativeImports,
  rewriteImportsForPackageLayout,
  writeCompatibilityStubs,
} from '@celo/protocol/scripts/staged-package-imports'
import { assert } from 'chai'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'

const write = (root: string, relativePath: string, content: string) => {
  const file = path.join(root, relativePath)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, content)
}

const read = (root: string, relativePath: string) =>
  fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('staged package imports', () => {
  let root: string

  beforeEach(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), 'staged-package-'))
  })

  afterEach(() => {
    fs.rmSync(root, { recursive: true, force: true })
  })

  describe('#rewriteImportsForPackageLayout()', () => {
    const trees = [
      { stagedDir: '', sourceDir: 'contracts' },
      { stagedDir: '0.5', sourceDir: 'contracts-0.5' },
    ]
    let repo: string
    let staged: string

    beforeEach(() => {
      repo = path.join(root, 'protocol')
      staged = path.join(root, 'staged')
      fs.mkdirSync(repo, { recursive: true })
      fs.mkdirSync(staged, { recursive: true })
    })

    it('maps a frozen 0.5 import of a shared interface onto the package root', () => {
      write(
        staged,
        '0.5/common/ProxyFactory.sol',
        'import "../../contracts/common/interfaces/IProxyFactory.sol";'
      )
      rewriteImportsForPackageLayout(staged, repo, trees)
      assert.equal(
        read(staged, '0.5/common/ProxyFactory.sol'),
        'import "../../common/interfaces/IProxyFactory.sol";'
      )
    })

    it('maps a repo-relative self import of the 0.5 tree onto 0.5/', () => {
      write(
        staged,
        '0.5/identity/IdentityProxyHub.sol',
        'import "../../contracts-0.5/common/Create2.sol";'
      )
      rewriteImportsForPackageLayout(staged, repo, trees)
      assert.equal(
        read(staged, '0.5/identity/IdentityProxyHub.sol'),
        'import "../common/Create2.sol";'
      )
    })

    it('maps a root import of the 0.5 tree from the package root', () => {
      write(staged, 'common/test/Mock.sol', 'import "../../../contracts-0.5/common/Proxy.sol";')
      rewriteImportsForPackageLayout(staged, repo, trees)
      assert.equal(read(staged, 'common/test/Mock.sol'), 'import "../../0.5/common/Proxy.sol";')
    })

    it('leaves imports of other trees and bare imports alone', () => {
      const source = [
        'import "../../lib/mento-core/contracts/interfaces/IExchange.sol";',
        'import "@openzeppelin/contracts8/access/Ownable.sol";',
        'import "./interfaces/IAccounts.sol";',
      ].join('\n')
      write(staged, 'common/UsingRegistry.sol', source)
      rewriteImportsForPackageLayout(staged, repo, trees)
      assert.equal(read(staged, 'common/UsingRegistry.sol'), source)
    })
  })

  describe('#writeCompatibilityStubs()', () => {
    it('re-exports moved sources at their old paths without overwriting real files', () => {
      write(root, 'common/Accounts.sol', 'pragma solidity ^0.8.19;\ncontract Accounts {}')
      write(root, '0.5/common/Proxy.sol', 'pragma solidity ^0.5.13;\ncontract Proxy {}')
      write(root, '0.5/common/UsingRegistry.sol', 'pragma solidity ^0.5.13;')
      write(root, 'common/UsingRegistry.sol', 'pragma solidity ^0.8.19;')
      writeCompatibilityStubs(root, '', '0.8', ['0.5'])
      writeCompatibilityStubs(root, '0.5', '', [])

      assert.include(read(root, '0.8/common/Accounts.sol'), 'pragma solidity ^0.8.19;')
      assert.include(read(root, '0.8/common/Accounts.sol'), 'import "../../common/Accounts.sol";')
      assert.include(read(root, 'common/Proxy.sol'), 'pragma solidity ^0.5.13;')
      assert.include(read(root, 'common/Proxy.sol'), 'import "../0.5/common/Proxy.sol";')
      // the real 0.8 file wins over a stub for the 0.5 one
      assert.equal(read(root, 'common/UsingRegistry.sol'), 'pragma solidity ^0.8.19;')
      // the 0.5 tree is not mirrored under 0.8/
      assert.isFalse(fs.existsSync(path.join(root, '0.8/0.5/common/Proxy.sol')))
      assert.deepEqual(findUnresolvedRelativeImports(root), [])
    })
  })

  describe('#findUnresolvedRelativeImports()', () => {
    beforeEach(() => {
      write(root, 'common/Initializable.sol', 'pragma solidity >=0.5.13 <0.9.0;')
      write(root, '0.8/common/IsL2Check.sol', 'pragma solidity ^0.8.19;')
    })

    it('accepts imports that resolve inside the package', () => {
      write(
        root,
        '0.8/common/Accounts.sol',
        [
          'import "../../common/Initializable.sol";',
          'import "./IsL2Check.sol";',
          'import { Ownable } from "@openzeppelin/contracts8/access/Ownable.sol";',
        ].join('\n')
      )
      assert.deepEqual(findUnresolvedRelativeImports(root), [])
    })

    it('reports imports that escape the package or point at missing files', () => {
      write(
        root,
        '0.8/common/PrecompilesOverride.sol',
        [
          'import "../../contracts-0.8/common/IsL2Check.sol";',
          'import "../../../outside/Thing.sol";',
          'import "./IsL2Check.sol";',
        ].join('\n')
      )
      assert.deepEqual(findUnresolvedRelativeImports(root), [
        {
          file: path.join('0.8', 'common', 'PrecompilesOverride.sol'),
          importPath: '../../contracts-0.8/common/IsL2Check.sol',
        },
        {
          file: path.join('0.8', 'common', 'PrecompilesOverride.sol'),
          importPath: '../../../outside/Thing.sol',
        },
      ])
    })

    it('only checks the published files and requires targets to be published too', () => {
      write(root, 'common/test/Mock.sol', 'import "../Initializable.sol";')
      write(root, 'common/Registry.sol', 'import "./test/Mock.sol";')
      const published = ['common/Initializable.sol', 'common/Registry.sol']
      assert.deepEqual(findUnresolvedRelativeImports(root, published), [
        { file: path.join('common', 'Registry.sol'), importPath: './test/Mock.sol' },
      ])
    })
  })
})
