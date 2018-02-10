const DEBUG = !!process.env.DEBUG
if (!DEBUG) process.env.CHROME_BIN = require('puppeteer').executablePath()

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['mocha', 'chai'],
    plugins: [
      require('karma-mocha'),
      require('karma-chai'),
      require('karma-chrome-launcher'),
      require('karma-rollup-preprocessor'),
      // require('karma-coverage')
    ],
    files: [
      { pattern: 'test/*-spec.js', watched: false }
    ],
    exclude: [],
    preprocessors: {
      'test/*-spec.js': ['rollup']
    },
    // coverageReporter: {
    //   type: 'html',
    //   dir: 'coverage/'
    // },
    rollupPreprocessor: {
      plugins: [
        require('rollup-plugin-babel')(),
        require('rollup-plugin-node-resolve')({
          jsnext: true,
          browser: true
        }),
        require('rollup-plugin-replace')({
          'process.env.NODE_ENV': JSON.stringify( 'production' )
        })
      ],
      format: 'iife', // Helps prevent naming collisions.
      name: 'lib', // Required for 'iife' format.
      sourcemap: 'inline' // Sensible for testing.
    },
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: DEBUG ? ['Chrome'] : ['ChromeHeadless'],
    singleRun: !DEBUG,
    concurrency: Infinity
  })
}
