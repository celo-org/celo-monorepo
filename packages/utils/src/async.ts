const TAG = 'utils/src/async'

type InFunction = (...params: any) => Promise<any>

// Retries an async function when it raises an exeption
// if all the tries fail it raises the last thrown exeption
export const retryAsync = async (
  inFunction: InFunction,
  tries: number,
  params: any,
  delay = 100
) => {
  let saveError
  for (let i = 0; i < tries + 1; i++) {
    try {
      // it awaits otherwise it'd always do all the retries
      return await inFunction(...params)
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, delay)) // sleeps `delay` milliseconds
      saveError = error
      console.info(`${TAG}/@reTryAsync, Failed to execute function on try #${i}`, error)
    }
  }

  throw saveError
}
