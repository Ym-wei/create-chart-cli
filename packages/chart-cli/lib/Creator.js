const inquirer = require('inquirer')
const path = require('path')
const ejs = require('ejs')
let { default: defaultPreset } = require('./promptModules')
let writeFileTree = require('./utils/writeFileTree')
let cloneDeep = require('lodash.clonedeep')
const { execa } = require('chart-cli-shared-utils')
const { isBinaryFileSync } = require('isbinaryfile')
const fs = require('fs')
const isManualMode = answers => answers.preset === '__manual__'
class Creator {
  constructor(name, context, promptModules) {
    this.name = name
    this.context = context
    const { presetPrompt, featurePrompt } = this.resolveIntroPrompts()
    this.presetPrompt = presetPrompt//presetPrompt对象有几个属性key??
    this.featurePrompt = featurePrompt//现在这里的选项是一个空数组
    //当前选择了某个特性后，这个特性可能会添加新的选择项 unit test  jest mocha  vueVersion 2 3
    this.injectedPrompts = []
    this.promptCompleteCbs = []//当选择完所有的选项后执行的回调数组
    this.run = this.run.bind(this)
  }

  run(command, args) {
    // 在context目录下执行命令
    return execa(command, args, {
      cwd: this.context
    })
  }

  getPkg(name) {
    return {
      'name': `@web-chart/${name}`,
      'version': '1.0.0',
      'license': 'ISC',
      'main': 'index.js',
      'dependencies': {
        'core-js': '^3.6.5',
        'vue': '^2.6.12'
      },
      'devDependencies': {
        '@vue/cli-plugin-babel': '~4.5.0',
        '@vue/cli-plugin-unit-jest': '~4.5.0',
        '@vue/test-utils': '^1.0.3',
        'vue-template-compiler': '^2.6.11'
      }
    }
  }

  async create() {
    // name 项目名
    // content 路径
    const { name, context } = this
    const files = {}
    let preset = await this.promptAndResolvePreset()
    preset = cloneDeep(preset)
    this.preset = preset
    const pkg = this.getPkg(name)
    await writeFileTree(context, {
      'package.json': JSON.stringify(pkg, null, 2)
    })
    const globby = require('globby')
    const codeTemplateSource = path.join(__dirname, '../template')
    const _files = await globby(['**/*'], { cwd: codeTemplateSource })

    console.log(_files, '_files ')
    for (const rawPath of _files) {
      const targetPath = rawPath.split('/').map(field => {
        // // 文件名处理_gitignore => .gitignore
        // if (field.charAt(0) === '_') {
        //   return `.${field.slice(1)}`
        // }
        return field
      }).join('/')

      // 模板文件夹里面原文件绝对路径
      const sourcePath = path.resolve(codeTemplateSource, rawPath)
      console.log(this.getParams(), '参数')
      const content = this.renderFile(sourcePath, this.getParams())
      // 不管是二进制还是文本 先缓存files中
      files[targetPath] = content
    }
    this.changeFilesName(files)

    await writeFileTree(context, files)
  }

  changeFilesName(files) {
    const { humpName, defaultName } = this.getParams()
    for (const fileName of Object.keys(files)) {
      let changeName = ''
      switch (true) {
        case fileName.indexOf('humpName') > -1:
          changeName = fileName.replace('humpName', humpName)
          files[changeName] = files[fileName]
          delete files[fileName]
          break
        case fileName.indexOf('defaultName') > -1:
          changeName = fileName.replace('defaultName', defaultName)
          files[changeName] = files[fileName]
          delete files[fileName]
          break
      }
    }
  }

  getParams() {
    // name:  bar-percentage
    const { name, preset } = this
    const splitNameArr = name.split('-')
    const humpName = splitNameArr.map(n => (n.charAt(0).toUpperCase() + n.slice(1)))
    return Object.assign({
      defaultName: name,
      humpName: humpName.join(''),
      humpSplitName: humpName.join('-'),
    }, preset)
  }

  renderFile(name, data) {
    if (isBinaryFileSync(name)) {
      return fs.readFileSync(name)
    }
    let template = fs.readFileSync(name, 'utf8')
    template = template.replace(/_/g, '')
    return ejs.render(template, data)
  }

  resolvePreset(name) {
    return this.getPresets()[name]
  }

  resolveFinalPrompts() {
    this.injectedPrompts.forEach(prompt => {
      let originWhen = prompt.when || (() => true)
      prompt.when = answers => {
        //如果是手工模式并且answers里有vueVersion特性的话才会弹出来
        return isManualMode(answers) && originWhen(answers)
      }
    })
    let prompts = [
      this.presetPrompt,//先让你选预设 default default vue3 manual
      this.featurePrompt,//再让你选特性  feature
      ...this.injectedPrompts//不同的promptModule插入的选项
    ]
    return prompts
  }

  getPresets() {
    return Object.assign({}, defaultPreset)
  }

  resolveIntroPrompts() {
    let presets = this.getPresets()
    const presetChoices = Object.entries(presets).map(([name, obj]) => {
      return {
        name: obj.name,
        value: name,
        obj
      }
    })
    //presetChoices=[{name:'Default',value:'default'},{name:'Default (Vue 3)'，value:'__default_vue_3__'}]
    const presetPrompt = {
      name: 'preset',//弹出项的名称 preset
      type: 'list',//如何选择 列表
      message: `请选择类型:`,//请选择一个预设
      choices: [
        ...presetChoices,
        {
          name: 'Manually select features',//手工选择特性
          value: '__manual__'
        }
      ]
    }
    const featurePrompt = {
      name: 'features',//弹出项的名称 features 手工选择的特性
      when: isManualMode,//如果when这个函数的返回值是true,就会弹出这个框，否则不弹这个框
      type: 'checkbox',//复选框
      message: 'Check the features needed for your project:',//手工你这个项目支持的特性
      choices: []
    }
    return { presetPrompt, featurePrompt }
  }

  async promptAndResolvePreset() {
    let answers = await inquirer.prompt(this.resolveFinalPrompts())
    let preset
    if (answers.preset && answers.preset !== '__manual__') {
      preset = await this.resolvePreset(answers.preset)
    } else {
      preset = {//如果是手工选项的
        plugins: {} // 默认没有任何插件
      }
      answers.features = answers.features || []
      this.promptCompleteCbs.forEach(cb => cb(answers, preset))
    }
    return preset
  }
}
module.exports = Creator


