module.exports = {
  presets: [
    require('@babel/preset-env')
  ],
  plugins: [
    require('@babel/plugin-syntax-dynamic-import')
  ],
  ignore: [
    'dist/*.js'
  ]
}