['pluginResolution', 'module'].forEach(m =>{
  Object.assign(exports, require(`./lib/${m}`))
})
exports.chalk = require('chalk')
exports.execa = require('execa')
const a = '1231'
debugger
