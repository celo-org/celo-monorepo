const FLAGS = {
  development: {
    ECOFUND: true,
    ENV: 'development',
    SDK: true,
  },
  production: {
    ECOFUND: true,
    ENV: 'production',
    SDK: true,
  },
  staging: {
    ECOFUND: true,
    ENV: 'staging',
    SDK: true,
  },
}
module.exports = FLAGS[process.env.DEPLOY_ENV]
