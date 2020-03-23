interface AppInfo {
  resultCount: number
  results: Array<{
    trackId: number
  }>
}

export async function getAppStoreId(bundleId: string) {
  const appStoreLookupUrl = `https://itunes.apple.com/lookup?bundleId=${bundleId}`
  const response = await fetch(appStoreLookupUrl)
  const appInfo: AppInfo = await response.json()
  if (appInfo.resultCount !== 1) {
    throw new Error('Can not determine AppStore ID: multiple or none results')
  }
  return appInfo.results[0].trackId.toString()
}
