export default function tearDown() {
  console.log('Stopping ganache')
  return (global as any).stopGanache().catch((err: any) => {
    console.error('error stopping ganache')
    console.error(err)
  })
}
