export function appendPath(baseUrl: string, path: string) {
  const lastChar = baseUrl[baseUrl.length - 1]
  if (lastChar === '/') {
    return baseUrl + path
  }
  return baseUrl + '/' + path
}

export const StringBase = {
  appendPath,
}
