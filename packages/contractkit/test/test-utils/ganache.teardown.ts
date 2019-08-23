export default function tearDown() {
  console.log('Stopping ganache')
  ;(global as any).stopGanache().catch((err: any) => {
    console.error('error stopping ganache')
    console.error(err)
  })
}
