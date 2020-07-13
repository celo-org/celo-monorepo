const { shouldReportFlakes } = require('./config')

function processFlakes(flakes, github) {
  if (flakes.length) {
    console.log('\nFlakey tests found :( \n')
    flakes.forEach((f) => console.log(f.title + '\n\n' + f.body))
    if (shouldReportFlakes) {
      console.log('Sending flakey tests to GitHub...\n')
      return Promise.all(flakes.map((f) => processFlake(f, github)))
    }
  } else {
    console.log('\nNo flakey tests found!\n')
  }
}

function processFlake(flake, github) {
  //return Promise.all([github.check(flake), github.issue(flake)]) //TODO(Alec): Clean this up
  return github.issue(flake)
}

module.exports = processFlakes
