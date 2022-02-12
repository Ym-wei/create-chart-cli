const path = require('path')
let Creator= require('./Creator');
/**
 * 创建项目
 * @param {}} projectName  项目的名称
 */
async function create(projectName){
  let cwd = process.cwd();//获取 当前的工作目录
  let name = projectName;//项目名
  let targetDir = path.join(cwd,name)
  const creator  = new Creator(name,targetDir);
  await creator.create();
}
module.exports = (...args)=>{
  return create(...args).catch(err=>{
    console.log(err);
  });
}
