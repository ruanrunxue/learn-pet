import type { UserConfigExport } from "@tarojs/cli"

export default {
  logger: {
    quiet: false,
    stats: true
  },
  defineConstants: {
    API_BASE_URL_H5: JSON.stringify('/api'),
    API_BASE_URL_WEAPP: (() => {
      const domain = process.env.REPLIT_DEV_DOMAIN;
      if (!domain) {
        console.warn('⚠️  WARNING: REPLIT_DEV_DOMAIN not set. WeChat Mini Program API calls may fail.');
        console.warn('    Please check your environment variables.');
      }
      return JSON.stringify(domain ? `https://${domain}/api` : '/api');
    })(),
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
