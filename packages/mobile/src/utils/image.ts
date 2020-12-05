import * as RNFS from 'react-native-fs'
import Logger from 'src/utils/Logger'

const mimeTypeToExtension: { [key: string]: string } = {
  'image/png': 'png',
  'image/x-png': 'png',
  'image/jpeg': 'jpeg',
  'image/pjpeg': 'jpeg',
  'image/jpg': 'jpg', // image/jpg is technically not a mime type, but handling it just in case.
}

// Data URL format: https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/Data_URIs
export const saveImageDataUrlToFile = (
  dataUrl: string,
  fileNameWithoutExtension: string
): string => {
  const mimeType = dataUrl
    .split(':')[1]
    .split(',')[0]
    .split(';')[0]
  const extension = mimeTypeToExtension[mimeType] || '.jpg'
  const fileName = `${fileNameWithoutExtension}.${extension}`
  const data = dataUrl
    .split(',')
    .slice(1) // Not sure if there could be more commas in the data, but if there are just join them again.
    .join(',')
  RNFS.writeFile(fileName, data, 'base64')
    .then(() => Logger.info('Image saved successfully'))
    .catch((e) => Logger.error('Error saving image', e))
  return fileName
}
