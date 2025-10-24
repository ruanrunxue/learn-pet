import type { UserConfigExport } from "@tarojs/cli"

export default {
   logger: {
    quiet: false,
    stats: true
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
