let writeFileTree = require('./utils/writeFileTree')
/**
 * 创建项目
 * @param {}} projectName  项目的名称
 */
async function create(projectName){
  let name = projectName;//项目名
  const obj = {}
  obj[`${name}.scss`] = JSON.stringify('@import \'./common/index\';', null, 2)
  await writeFileTree(name, obj)
}

module.exports = (...args)=>{
  return create(...args).catch(err=>{
    console.log(err);
  });
}
