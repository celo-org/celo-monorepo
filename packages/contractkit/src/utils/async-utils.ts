// Return the object with Promise properties resolved.
export function promisedProperties(object: { [key: string]: any }) {
  var promisedProperties: any[] = []
  const objectKeys = Object.keys(object)
  objectKeys.forEach((key) => promisedProperties.push(object[key]))
  return Promise.all(promisedProperties).then((resolvedValues) => {
    return resolvedValues.reduce((resolvedObject, property, index) => {
      resolvedObject[objectKeys[index]] = property
      return resolvedObject
    }, object)
  })
}
