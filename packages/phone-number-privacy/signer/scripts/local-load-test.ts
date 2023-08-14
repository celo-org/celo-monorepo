// tslint:disable: no-console

async function start() {
  // TODO
}

start()
  .then(() => {
    console.info('load test complete')
    process.exit(0)
  })
  .catch((e) => {
    console.error('load test failed', e)
    process.exit(1)
  })
