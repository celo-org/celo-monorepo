const GitHub = require('../src/github.js')

const main = async () => {
  const github = await GitHub.build()
  await github.addSummaryCheck()
}

main()
