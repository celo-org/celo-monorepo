import { update } from './dependency-graph-utils'

update()
  .then(() => {
    console.info('Successfully updated dependency graph!')
    process.exit(0)
  })
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
