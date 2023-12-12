import { expect } from '@jest/globals'
import { execSync } from 'child_process'
import { SemVer } from 'semver'
import { determineNextVersion, getReleaseTypeFromSemVer } from './utils'

jest.mock('child_process', () => ({
  execSync: jest.fn(),
}))

afterEach(() => {
  jest.clearAllMocks()
})

const execSyncMock = execSync as jest.Mock

const retrieveReleaseInformation = (version: SemVer): [string, string | number] => {
  return [version.version, getReleaseTypeFromSemVer(version)]
}

describe('utils', () => {
  describe('determineNextVersion()', () => {
    it('determines post-audit release tag', () => {
      const nextVersion = determineNextVersion(
        'core-contracts.v11.2.3.post-audit',
        'release/core-contracts/11.0.0',
        'alpha'
      )

      expect(retrieveReleaseInformation(nextVersion)).toEqual(['11.2.3', 'latest'])
    })

    it('determines pre-audit release tag', () => {
      const nextVersion = determineNextVersion(
        'core-contracts.v11.2.3.pre-audit',
        'release/core-contracts/11.0.0',
        'alpha'
      )

      expect(retrieveReleaseInformation(nextVersion)).toEqual(['11.2.3-pre-audit.0', 'pre-audit'])
    })

    it('determines for release git branch when major version matches', () => {
      execSyncMock.mockReturnValue('11.2.3')

      const nextVersion = determineNextVersion('', 'release/core-contracts/11.2.3', 'alpha')

      expect(execSyncMock).toHaveBeenCalledTimes(1)
      expect(execSyncMock).toHaveBeenNthCalledWith(
        1,
        'npm view @celo/contracts@canary version',
        expect.anything()
      )
      expect(retrieveReleaseInformation(nextVersion)).toEqual(['11.2.4-canary.0', 'canary'])
    })

    it("determines for release git branch when major version doesn't match", () => {
      execSyncMock.mockReturnValue('11.2.3')

      const nextVersion = determineNextVersion('', 'release/core-contracts/12.0.0', 'alpha')

      expect(execSyncMock).toHaveBeenCalledTimes(1)
      expect(execSyncMock).toHaveBeenNthCalledWith(
        1,
        'npm view @celo/contracts@canary version',
        expect.anything()
      )
      expect(retrieveReleaseInformation(nextVersion)).toEqual(['12.0.0-canary.0', 'canary'])
    })

    it("determines based on manually provided npm tag that already exists, doesn't fallback to 'canary'", () => {
      execSyncMock.mockImplementationOnce(() => {
        return '10.2.3'
      })

      const nextVersion = determineNextVersion('', 'dev/some-branch-name', 'alpha')

      expect(execSyncMock).toHaveBeenCalledTimes(1)
      expect(execSyncMock).toHaveBeenNthCalledWith(
        1,
        'npm view @celo/contracts@alpha version',
        expect.anything()
      )
      expect(retrieveReleaseInformation(nextVersion)).toEqual(['10.2.4-alpha.0', 'alpha'])
    })

    it("determines based on manually provided npm tag that doesn't exist yet, fallback to 'canary'", () => {
      execSyncMock
        .mockImplementationOnce(() => {
          throw new Error("npm view exists with code > 0 when tag doesn't exist")
        })
        .mockImplementationOnce(() => {
          return '10.1.2'
        })

      const nextVersion = determineNextVersion('', 'dev/some-branch-name', 'alpha')

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
      expect(retrieveReleaseInformation(nextVersion)).toEqual(['10.1.3-alpha.0', 'alpha'])
    })

    it("doesn't determine anything when wrong tag is provided", () => {
      const nextVersion = determineNextVersion('', '', 'tag-with-dashes')

      expect(nextVersion).toBeNull()
    })

    it("doesn't determine anything when nothing is provided", () => {
      const nextVersion = determineNextVersion('', '', '')

      expect(nextVersion).toBeNull()
    })
  })
})
