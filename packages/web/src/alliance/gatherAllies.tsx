export default async function gatherAllies(
  persistFunc: (data: []) => void,
  signal: {
    aborted: boolean
  }
) {
  const response = await fetch('api/alliance')
  const alliesByCategory = await response.json()
  if (!signal.aborted) {
    persistFunc(alliesByCategory)
  }
}
