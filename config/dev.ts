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
      allowedHosts: 'all'
    }
  }
} satisfies UserConfigExport<'webpack5'>
