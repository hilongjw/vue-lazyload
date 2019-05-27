const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const uglify = require('rollup-plugin-uglify')
const resolve = require('rollup-plugin-node-resolve')
const commonjs = require('rollup-plugin-commonjs')
const version = process.env.VERSION || require('./package.json').version

const banner =
    '/*!\n' +
    ' * Vue-Lazyload.js v' + version + '\n' +
    ' * (c) ' + new Date().getFullYear() + ' Awe <hilongjw@gmail.com>\n' +
    ' * Released under the MIT License.\n' +
    ' */\n'

async function build (options, output) {
  try {
    const bundle = await rollup.rollup(options)

    let { code } = await bundle.generate({
      format: output.format,
      name: 'VueLazyload'
    })

    code = rewriteVersion(code)

    await write(path.resolve(__dirname, output.filename), code)
  } catch (e) {
    console.error(e)
  }
}

function rewriteVersion (code) {
  return code.replace('__VUE_LAZYLOAD_VERSION__', version)
}

function getSize (code) {
  return (code.length / 1024).toFixed(2) + 'kb'
}

function blue (str) {
  return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}

function write (dest, code) {
  return new Promise(function (resolve, reject) {
    code = banner + code
    fs.writeFile(dest, code, function (err) {
      if (err) return reject(err)
      console.log(blue(dest) + ' ' + getSize(code))
      resolve()
    })
  })
}

build({
  input: path.resolve(__dirname, 'src/index.js'),
  plugins: [
    resolve(),
    commonjs(),
    babel({ runtimeHelpers: true }),
    uglify()
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
    babel({ runtimeHelpers: true })
  ]
}, {
  format: 'es',
  filename: 'vue-lazyload.esm.js'
})
