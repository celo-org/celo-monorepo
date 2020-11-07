import { updateGraph } from './dependency-graph-utils'

updateGraph()
  .then(() => {
    console.info('Successfully updated dependency graph!')
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
