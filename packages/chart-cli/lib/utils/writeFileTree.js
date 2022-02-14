let fs = require('fs-extra')
let path = require('path')

module.exports = async function(name, files){
  Object.keys(files).forEach(fileName => {
    const targetPath = 'packages/@web/chart'
    const cwdPath = process.cwd()
    const filePath = path.join(cwdPath, targetPath, name, fileName)
    console.log('文件路径', filePath)
    // 确保文件所在的目录存在, 不存在会创建
    fs.ensureDirSync(path.dirname(filePath))
    fs.writeFileSync(filePath, files[fileName])
  })
}
