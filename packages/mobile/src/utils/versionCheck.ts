export function isVersionBelowMinimum(version: string, minVersion: string): boolean {
  const minVersionArray = minVersion.split('.')
  const versionArray = version.split('.')
  const minVersionLength = Math.min(minVersionArray.length, version.length)
  for (let i = 0; i < minVersionLength; i++) {
    if (minVersionArray[i] > versionArray[i]) {
      return true
    } else if (minVersionArray[i] < versionArray[i]) {
      return false
    }
  }
  if (minVersionArray.length > versionArray.length) {
    return true
  }
  return false
}
