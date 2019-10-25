// Translate a file using google translate
// tslint:disable: no-console

const fs = require('fs')
const request = require('request')

const fileName = process.argv[2]
const googleApiToken = process.argv[3]
console.info(`Translating file: ${fileName}`)

const json = fs.readFileSync(`../locales/en-US/${fileName}`)
const strings = JSON.parse(json)
console.info(`Found ${Object.keys(strings).length} strings`)

function translateString(s) {
  return new Promise((resolve, reject) => {
    console.info(`Looking up ${s}`)
    request.post(
      'https://translation.googleapis.com/language/translate/v2',
      {
        headers: {
          Authorization: `Bearer ${googleApiToken}`,
        },
        json: {
          format: 'text',
          q: s,
          source: 'en',
          target: 'es',
        },
      },
      (error, res, body) => {
        if (error) {
          reject(error)
          return
        }
        resolve(body.data.translations[0].translatedText)
      }
    )
  })
}

async function translateStrings(stringsToTranslate) {
  const translations = {}

  const promises = Promise.all(
    Object.keys(stringsToTranslate).map(async (key) => {
      const val = stringsToTranslate[key]

      if (typeof val === 'string') {
        const t = await translateString(val)
        translations[key] = t
      } else if (typeof stringsToTranslate === 'object') {
        translations[key] = await translateStrings(val)
      }
    })
  )

  await promises
  return translations
}

translateStrings(strings).then((translations) => console.log(JSON.stringify(translations)))
