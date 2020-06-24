const getTestID = (test) => {
  const titles = []
  let parent = test

  do {
    titles.unshift(parent.name)
  } while ((parent = parent.parent))

  titles.shift() // remove TOP_DESCRIBE_BLOCK_NAME

  return titles.join(' ')
}

module.exports = {
  getTestID: getTestID,
}
