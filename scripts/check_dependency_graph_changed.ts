import { graphHasChanged } from './dependency-graph-utils'

async function main() {
  const hasChanged = await graphHasChanged()
  if (hasChanged) {
    console.info('true')
    return
  }
  console.info('false')
}
main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
