function processFlakes(flakes, github) {
  console.log('PROCESS FLAKES \n')
  return Promise.all(flakes.map((f) => processFlake(f, github)))
}

function processFlake(flake, github) {
  //return Promise.all(actions.map((a) => a(flake)))
  if (process.env.CI) {
    return Promise.all([github.check(flake), github.issue(flake)])
  }
}

module.exports = {
  processFlakes: processFlakes,
  processFlake: processFlake,
}
