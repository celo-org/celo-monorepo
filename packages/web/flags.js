const FLAGS = {
  development: {
    ECOFUND: true,
    SDK: true,
  },
  production: {
    ECOFUND: false,
    SDK: false,
  },
  staging: {
    ECOFUND: false,
    SDK: false,
  },
}
module.exports = FLAGS[process.env.DEPLOY_ENV]
