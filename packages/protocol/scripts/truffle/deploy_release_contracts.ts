module.exports = async (callback: (error?: any) => number) => {
  try {
    console.log('HERE')
  } catch (error) {
    callback(error)
  }
}
