// Return the object with Promise properties resolved.
export function promisedProperties(object: { [key: string]: any }) {
  const properties: any[] = []
  const objectKeys = Object.keys(object)
  objectKeys.forEach((key) => properties.push(object[key]))
  return Promise.all(properties).then((resolvedValues) => {
    return resolvedValues.reduce((resolvedObject, property, index) => {
      resolvedObject[objectKeys[index]] = property
      return resolvedObject
    }, object)
  })
}
