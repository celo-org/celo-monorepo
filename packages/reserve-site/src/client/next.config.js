module.exports = {
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Important: return the modified config
    config.module.rules.push({
      test: /\.md$/,
      use: [
        {
          loader: 'raw-loader',
          options: {
            esModule: false,
          },
        },
      ],
    })
    return config
  },
  target: 'serverless',
  distDir: '../../dist/client',
  exportPathMap: function() {
    return {
      '/': { page: '/' },
    }
  },
}
