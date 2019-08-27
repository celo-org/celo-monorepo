const FLAGS = {
  development: {
    ECOFUND: true,
    ENV: 'development',
    SDK: true,
  },
  production: {
    ECOFUND: false,
    ENV: 'production',
    SDK: false,
  },
  staging: {
    ECOFUND: false,
    ENV: 'staging',
    SDK: false,
  },
}
module.exports = FLAGS[process.env.DEPLOY_ENV]
