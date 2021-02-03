export function compareVersion(version1: string, version2: string) {
  const v1 = version1.split('.')
  const v2 = version2.split('.')
  const k = Math.min(v1.length, v2.length)
  for (let i = 0; i < k; ++i) {
    const n1 = parseInt(v1[i], 10)
    const n2 = parseInt(v2[i], 10)
    if (n1 > n2) {
      return 1
    }
    if (n1 < n2) {
      return -1
    }
  }
  return v1.length === v2.length ? 0 : v1.length < v2.length ? -1 : 1
}

export function isVersionBelowMinimum(version: string, minVersion: string): boolean {
  return compareVersion(version, minVersion) < 0
}

// Check that version is between minVersion (included) and maxVersion (included)
export function isVersionInRange(
  version: string,
  minVersion: string | undefined,
  maxVersion: string | undefined
): boolean {
  if (minVersion && compareVersion(version, minVersion) < 0) {
    return false
  }
  if (maxVersion && compareVersion(version, maxVersion) > 0) {
    return false
  }
  return true
}
