export default function tearDown() {
  try {
    console.info('Stopping ganache')
    // eslint-disable-next-line
    return (global as any).stopGanache()
  } catch (err) {
    console.error('error stopping ganache')
    console.error(err)
  }
}
