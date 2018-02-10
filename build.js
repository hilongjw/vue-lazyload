const fs = require('fs')
const path = require('path')
const rollup = require('rollup')
const babel = require('rollup-plugin-babel')
const uglify = require('rollup-plugin-uglify')
const version = process.env.VERSION || require('./package.json').version

const banner =
    '/*!\n' +
    ' * Vue-Lazyload.js v' + version + '\n' +
    ' * (c) ' + new Date().getFullYear() + ' Awe <hilongjw@gmail.com>\n' +
    ' * Released under the MIT License.\n' +
    ' */\n'
async function build() {
    try {
        const bundle = await rollup.rollup({
            input: path.resolve(__dirname, 'src/index.js'),
            plugins: [
                babel({ runtimeHelpers: true }),
                uglify()
            ]
        })

        let { code } = await bundle.generate({
            format: 'umd',
            name: 'VueLazyload'
        })

        code = rewriteVersion(code)

        await write(path.resolve(__dirname, 'vue-lazyload.js'), code)

        console.log('Vue-Lazyload.js v' + version + ' builded')
    } catch (e) {
        console.log(e)
    }
}

function rewriteVersion(code) {
    return code.replace('__VUE_LAZYLOAD_VERSION__', version)
}

function getSize(code) {
    return (code.length / 1024).toFixed(2) + 'kb'
}

function blue(str) {
    return '\x1b[1m\x1b[34m' + str + '\x1b[39m\x1b[22m'
}

function write(dest, code) {
    return new Promise(function (resolve, reject) {
        code = banner + code
        fs.writeFile(dest, code, function (err) {
            if (err) return reject(err)
            console.log(blue(dest) + ' ' + getSize(code))
            resolve()
        })
    })
}

build()
