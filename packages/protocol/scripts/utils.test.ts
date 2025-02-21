import { expect } from '@jest/globals'
import { execSync } from 'child_process'
import { SemVer } from 'semver'
import {
  determineNextVersion,
  getReleaseTypeFromSemVer,
  isValidNpmTag,
  isValidPrereleaseIdentifier,
} from './utils'

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}))

afterEach(() => {
  jest.clearAllMocks()
})

const retrieveReleaseInformation = (version: SemVer): [string, string | number] => {
  return [version.version, getReleaseTypeFromSemVer(version)]
}

describe('utils', () => {
  describe('determineNextVersion()', () => {
    const execSyncMock = execSync as jest.Mock

    it('determines "latest" release type and extracts version from "post-audit" git tag directly for version 11.2.3', () => {
      const nextVersion = determineNextVersion(
        'core-contracts.v12',
        'release/core-contracts/12',
        '@celo/contracts',
        'alpha'
      )

      expect(retrieveReleaseInformation(nextVersion!)).toEqual(['12.0.0', 'latest'])
    })

    it('determines "post-audit" release type and extracts version from "post-audit" git tag directly', () => {
      const nextVersion = determineNextVersion(
        'core-contracts.v11.2.3.post-audit',
        'release/core-contracts/11.0.0',
        '@celo/contracts',
        'alpha'
      )

      expect(retrieveReleaseInformation(nextVersion!)).toEqual([
        '11.2.3-post-audit.0',
        'post-audit',
      ])
    })

    it('determines "pre-audit" release type and extracts version from "pre-audit" git tag directly', () => {
      const nextVersion = determineNextVersion(
        'core-contracts.v11.2.3.pre-audit',
        'release/core-contracts/11.0.0',
        '@celo/contracts',
        'alpha'
      )

      expect(retrieveReleaseInformation(nextVersion!)).toEqual(['11.2.3-pre-audit.0', 'pre-audit'])
    })

    it('uses the tag directly when a semver compliant prerelease identifier is used', () => {
      const nextVersion = determineNextVersion(
        'core-contracts.v12.post-audit',
        'master',
        '@celo/contracts',
        ''
      )

      expect(nextVersion).not.toBeNull()
      expect(retrieveReleaseInformation(nextVersion!)).toEqual([
        '12.0.0-post-audit.0',
        'post-audit',
      ])
    })

    it('falls back to alpha when non semver compliant prerelease identifier is used', () => {
      const nextVersion = determineNextVersion(
        'core-contracts.v12.post_audit_2',
        'master',
        '@celo/contracts',
        ''
      )

      expect(nextVersion).not.toBeNull()
      expect(retrieveReleaseInformation(nextVersion!)).toEqual(['12.0.0-alpha.0', 'alpha'])
    })

    it('determines for release git branch when major version matches', () => {
      execSyncMock.mockReturnValue('11.2.3')

      const nextVersion = determineNextVersion(
        '',
        'release/core-contracts/11.2.3',
        '@celo/contracts',
        'alpha'
      )

      expect(execSyncMock).toHaveBeenCalledTimes(1)
      expect(execSyncMock).toHaveBeenNthCalledWith(
        1,
        'npm view @celo/contracts@canary version',
        expect.anything()
      )

      expect(nextVersion).not.toBeNull()
      expect(retrieveReleaseInformation(nextVersion!)).toEqual(['11.2.4-canary.0', 'canary'])
    })

    it("determines for release git branch when major version doesn't match", () => {
      execSyncMock.mockReturnValue('11.2.3')

      const nextVersion = determineNextVersion(
        '',
        'release/core-contracts/12.0.0',
        '@celo/contracts',
        'alpha'
      )

      expect(execSyncMock).toHaveBeenCalledTimes(1)
      expect(execSyncMock).toHaveBeenNthCalledWith(
        1,
        'npm view @celo/contracts@canary version',
        expect.anything()
      )

      expect(nextVersion).not.toBeNull()
      expect(retrieveReleaseInformation(nextVersion!)).toEqual(['12.0.0-canary.0', 'canary'])
    })

    it("determines based on manually provided npm tag that already exists, doesn't fallback to 'canary'", () => {
      execSyncMock.mockImplementationOnce(() => {
        return '10.2.4-alpha.0'
      })

      const nextVersion = determineNextVersion(
        '',
        'dev/some-branch-name',
        '@celo/contracts',
        'alpha'
      )

      expect(execSyncMock).toHaveBeenCalledTimes(1)
      expect(execSyncMock).toHaveBeenNthCalledWith(
        1,
        'npm view @celo/contracts@alpha version',
        expect.anything()
      )

      expect(nextVersion).not.toBeNull()
      expect(retrieveReleaseInformation(nextVersion!)).toEqual(['10.2.4-alpha.1', 'alpha'])
    })

    it("determines based on manually provided npm tag that doesn't exist yet, fallback to 'canary'", () => {
      execSyncMock
        .mockImplementationOnce(() => {
          throw new Error("npm view exists with code > 0 when tag doesn't exist")
        })
        .mockImplementationOnce(() => {
          return '10.1.2-canary.2'
        })

      const nextVersion = determineNextVersion(
        '',
        'dev/some-branch-name',
        '@celo/contracts',
        'alpha'
      )

      expect(execSyncMock).toHaveBeenCalledTimes(2)
      expect(execSyncMock).toHaveBeenNthCalledWith(
        1,
        'npm view @celo/contracts@alpha version',
        expect.anything()
      )
      expect(execSyncMock).toHaveBeenNthCalledWith(
        2,
        'npm view @celo/contracts@canary version',
        expect.anything()
      )

      expect(nextVersion).not.toBeNull()
      expect(retrieveReleaseInformation(nextVersion!)).toEqual(['10.1.2-alpha.0', 'alpha'])
    })

    it("doesn't determine anything when wrong tag is provided", () => {
      const nextVersion = determineNextVersion(
        '',
        '',
        '@celo/contracts',
        'tag-with-dashes-at-the-end-'
      )

      expect(nextVersion).toBeNull()
    })

    it("doesn't determine anything when nothing is provided", () => {
      const nextVersion = determineNextVersion('', '', '', '')

      expect(nextVersion).toBeNull()
    })
  })

  describe('tags', () => {
    it('recognizes valid tags and prerelease identifiers', () => {
      expect(isValidNpmTag('latest')).toEqual(true)
      expect(isValidPrereleaseIdentifier('latest')).toEqual(true)

      expect(isValidNpmTag('alpha')).toEqual(true)
      expect(isValidPrereleaseIdentifier('alpha')).toEqual(true)

      expect(isValidNpmTag('beta')).toEqual(true)
      expect(isValidPrereleaseIdentifier('beta')).toEqual(true)

      expect(isValidNpmTag('canary')).toEqual(true)
      expect(isValidPrereleaseIdentifier('canary')).toEqual(true)

      expect(isValidNpmTag('rc')).toEqual(true)
      expect(isValidPrereleaseIdentifier('rc')).toEqual(true)

      expect(isValidNpmTag('valid-tag')).toEqual(true)
      expect(isValidPrereleaseIdentifier('valid-tag')).toEqual(true)

      expect(isValidNpmTag('alfajores')).toEqual(true)
      expect(isValidPrereleaseIdentifier('alfajores')).toEqual(true)

      expect(isValidNpmTag('alfajores2')).toEqual(true)
      expect(isValidPrereleaseIdentifier('alfajores2')).toEqual(true)

      expect(isValidNpmTag('alfajores3')).toEqual(true)
      expect(isValidPrereleaseIdentifier('alfajores3')).toEqual(true)

      expect(isValidNpmTag('baklava')).toEqual(true)
      expect(isValidPrereleaseIdentifier('baklava')).toEqual(true)

      expect(isValidNpmTag('post-audit')).toEqual(true)
      expect(isValidPrereleaseIdentifier('post-audit')).toEqual(true)

      expect(isValidNpmTag('post_audit')).toEqual(true)
      expect(isValidPrereleaseIdentifier('post_audit')).toEqual(false)

      expect(isValidNpmTag('post_audit_2')).toEqual(true)
      expect(isValidPrereleaseIdentifier('post_audit_2')).toEqual(false)
    })

    it('recognizes invalid tags', () => {
      expect(isValidNpmTag('123')).toEqual(false)
      expect(isValidNpmTag('alpha-')).toEqual(false)
      expect(isValidNpmTag('-beta')).toEqual(false)
      expect(isValidNpmTag('--')).toEqual(false)
    })
  })
})
