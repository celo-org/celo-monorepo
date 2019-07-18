interface ObjectWithStringsAndUndefined {
  [key: string]: string | undefined
}

interface ObjectWithStrings {
  [key: string]: string
}

export function removeEmptyValuesFromObject(obj: ObjectWithStringsAndUndefined) {
  const newObj: ObjectWithStrings = {}
  Object.keys(obj)
    // @ts-ignore
    .filter((k) => obj[k] !== null && obj[k] !== undefined)
    // @ts-ignore
    .forEach((k) => (newObj[k] = obj[k]))
  return newObj
}
