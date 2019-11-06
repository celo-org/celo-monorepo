const { Storage } = require('@google-cloud/storage')

const sleep = async (time: number) => {
  return new Promise((resolve) => setTimeout(resolve, time))
}

export const createClient = (credentials?: any) => {
  return new Storage({ credentials })
}

// Location ref: https://cloud.google.com/storage/docs/locations
// Storage classes ref: https://cloud.google.com/storage/docs/storage-classes
export const createBucket = async (
  client: any,
  bucketName: string,
  location: string = 'US-CENTRAL1',
  storageClass: string = 'COLDLINE'
) => {
  await client.createBucket(bucketName, {
    location,
    storageClass,
  })
  await sleep(2000)
}

export const createBucketIfNotExists = async (
  client: any,
  bucketName: string,
  location: string = 'US-CENTRAL1',
  storageClass: string = 'COLDLINE'
) => {
  if (!(await checkBucketExists(client, bucketName))) {
    await createBucket(client, bucketName, location, storageClass)
  }
}

export const getBuckets = async (client: any) => {
  const [buckets] = await client.getBuckets()
  return buckets
}

export const getFiles = async (client: any, bucketName: string) => {
  const [files] = await client.bucket(bucketName).getFiles()
  return files
}

export const checkBucketExists = async (client: any, bucketName: string) => {
  const buckets = await getBuckets(client)
  return buckets.some((bucket: any) => bucket.name === bucketName)
}

export const deleteBucket = async (client: any, bucketName: string) => {
  await client.bucket(bucketName).delete()
}

export const fileUpload = async (
  client: any,
  bucketName: string,
  srcFileName: string,
  useCache: boolean = true
) => {
  const uploadOptions = {
    gzip: true,
    metadata: {
      cacheControl: useCache ? 'public, max-age=31536000' : 'no-cache',
    },
  }

  await client.bucket(bucketName).upload(srcFileName, uploadOptions)
}

export const fileDownload = async (
  client: any,
  bucketName: string,
  srcFileName: string,
  dstFileName: string
) => {
  await client
    .bucket(bucketName)
    .file(srcFileName)
    .download({
      destination: dstFileName,
    })
}
