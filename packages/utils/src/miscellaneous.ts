const TAG = 'utils/src/miscellaneous'

type InFunction = (...params: any) => Promise<any>

export const retryAsync = async (
  inFunction: InFunction,
  tries: number,
  params: any,
  delay = 100
) => {
  let saveError
  for (let i = 0; i < tries + 1; i++) {
    try {
      // it awaits otherwaise it'd always do all the retries
      return await inFunction(...params)
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, delay)) // sleeps `delay` milliseconds
      saveError = error
      console.info(`${TAG}/@reTryAsync, Failed to execute function on try #${i}`, error)
    }
  }

  throw saveError
}
