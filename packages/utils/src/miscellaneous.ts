// import Logger from '@celo/mobile/src/utils/Logger';

const TAG = 'utils/src/miscellaneous'

export const reTryAsync = async (inFunction: any, tries: number, params: any) => {
  let saveError
  for (let i = 0; i < tries + 1; i++) {
    try {
      return await inFunction(...params)
    } catch (error) {
      saveError = error
      //Logger.error(`${TAG}/@reTryAsync`, `Failed to execute function on try #${i}`, error)
      console.log(`${TAG}/@reTryAsync, Failed to execute function on try #${i}`)
    }
  }

  throw saveError
}
