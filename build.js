const path = require('path')
const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const replace = require('@rollup/plugin-replace')
const { terser } = require('rollup-plugin-terser')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const version = process.env.VERSION || require('./package.json').version

const banner =
    '/*!\n' +
    ' * Vue-Lazyload.js v' + version + '\n' +
    ' * (c) ' + new Date().getFullYear() + ' Awe <hilongjw@gmail.com>\n' +
    ' * Released under the MIT License.\n' +
    ' */\n'

async function build (options, _outputOptions) {
  try {
    const bundle = await rollup.rollup(options)
    const outputOptions = {
      format: _outputOptions.format,
      exports: 'named',
      banner: banner,
      file: path.resolve(__dirname, _outputOptions.filename),
      name: 'VueLazyload'
    }
    const { output } = await bundle.generate(outputOptions)
    await bundle.write(outputOptions)
    const code = output[0].code
    console.log(blue(outputOptions.file) + ' ' + getSize(code))
  } catch (e) {
    console.error(e)
  }
}

function getSize (code) {
  return (Buffer.byteLength(code, 'utf8') / 1024).toFixed(2) + 'kb'
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}

build({
  input: path.resolve(__dirname, 'src/index.js'),
  plugins: [
    resolve(),
    commonjs(),
    babel({ runtimeHelpers: true }),
    replace({
      '__VUE_LAZYLOAD_VERSION__': JSON.stringify(version)
    }),
    terser()
  ]
}, {
  format: 'umd',
  filename: 'vue-lazyload.js'
})

build({
  input: path.resolve(__dirname, 'src/index.js'),
  plugins: [
    resolve(),
    commonjs(),
    replace({
      '__VUE_LAZYLOAD_VERSION__': JSON.stringify(version)
    }),
    babel({ runtimeHelpers: true })
  ]
}, {
  format: 'esm',
  filename: 'vue-lazyload.esm.js'
})
