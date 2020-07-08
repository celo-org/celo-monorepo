function processFlakes(flakes, github) {
  return Promise.all(flakes.map((f) => processFlake(f, github)))
}

function processFlake(flake, github) {
  if (process.env.CI) {
    return Promise.all([github.check(flake), github.issue(flake)])
  }
}

module.exports = {
  processFlakes: processFlakes,
  processFlake: processFlake,
}
