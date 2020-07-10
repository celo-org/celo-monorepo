const { shouldReportFlakes } = require('./config')

function processFlakes(flakes, github) {
  if (flakes.length) {
    console.log('\nFlakey tests found :( \n\n' + flakes)
    //if (shouldReportFlakes) {
    if (process.env.CI) {
      console.log('\nSending flakey tests to GitHub...\n')
      return Promise.all(flakes.map((f) => processFlake(f, github)))
    }
  } else {
    console.log('No flakey tests found!')
  }
}

function processFlake(flake, github) {
  return Promise.all([github.check(flake), github.issue(flake)])
}

module.exports = processFlakes
