import type { UserConfigExport } from "@tarojs/cli"

export default {
  logger: {
    quiet: false,
    stats: true
  },
  defineConstants: {
    API_BASE_URL_H5: JSON.stringify('/api'),
    API_BASE_URL_WEAPP: JSON.stringify(
      process.env.REPLIT_DEV_DOMAIN 
        ? `https://${process.env.REPLIT_DEV_DOMAIN}/api`
        : '/api'
    ),
  },
  mini: {},
  h5: {
    devServer: {
      host: '0.0.0.0',
      port: 5000,
      allowedHosts: 'all',
      proxy: {
        '/api': {
          target: 'http://0.0.0.0:3001',
          changeOrigin: true,
          secure: false
        }
      }
    }
  }
} satisfies UserConfigExport<'webpack5'>
