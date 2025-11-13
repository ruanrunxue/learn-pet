import type { UserConfigExport } from "@tarojs/cli"

export default {
  defineConstants: {
    API_BASE_URL_H5: JSON.stringify('/api'),
    API_BASE_URL_WEAPP: (() => {
      const domain = process.env.PRODUCTION_DOMAIN || process.env.REPLIT_DEV_DOMAIN;
      if (!domain) {
        console.error('❌ ERROR: Neither PRODUCTION_DOMAIN nor REPLIT_DEV_DOMAIN is set!');
        console.error('   WeChat Mini Program will NOT work without a domain.');
        console.error('   Please set PRODUCTION_DOMAIN in your environment secrets.');
        throw new Error('Missing required environment variable: PRODUCTION_DOMAIN or REPLIT_DEV_DOMAIN');
      }
      return JSON.stringify(`https://${domain}/api`);
    })(),
  },
  mini: {},
  h5: {
    /**
     * WebpackChain 插件配置
     * @docs https://github.com/neutrinojs/webpack-chain
     */
    // webpackChain (chain) {
    //   /**
    //    * 如果 h5 端编译后体积过大，可以使用 webpack-bundle-analyzer 插件对打包体积进行分析。
    //    * @docs https://github.com/webpack-contrib/webpack-bundle-analyzer
    //    */
    //   chain.plugin('analyzer')
    //     .use(require('webpack-bundle-analyzer').BundleAnalyzerPlugin, [])
    //   /**
    //    * 如果 h5 端首屏加载时间过长，可以使用 prerender-spa-plugin 插件预加载首页。
    //    * @docs https://github.com/chrisvfritz/prerender-spa-plugin
    //    */
    //   const path = require('path')
    //   const Prerender = require('prerender-spa-plugin')
    //   const staticDir = path.join(__dirname, '..', 'dist')
    //   chain
    //     .plugin('prerender')
    //     .use(new Prerender({
    //       staticDir,
    //       routes: [ '/pages/index/index' ],
    //       postProcess: (context) => ({ ...context, outputPath: path.join(staticDir, 'index.html') })
    //     }))
    // }
  }
} satisfies UserConfigExport<'webpack5'>
