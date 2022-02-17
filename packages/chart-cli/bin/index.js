#!/usr/bin/env node
const program = require('commander');
program
  .version(`chart-cli 0.0.0}`)//可以指定版本号
  .usage('<command> [options]')//可以指定使用方式 命令 参数

program
  .command('create <app-name>') //添加一个命令 create <表示必选参数>
  .description('create a new project powered by vue-cli-service')
  .action((appName) => {
    require('../lib/create')(appName);
  })

program
  .command('add <file-name>') //添加一个命令 create <表示必选参数>
  .description('创建文件')
  .action((appName) => {
    require('../lib/add')(appName);
  })

program.parse(process.argv)
