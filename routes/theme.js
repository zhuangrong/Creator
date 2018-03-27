var express = require('express')
var router = express.Router()
var fs=require('fs')  
var path = require('path')

/* post theme variables
 * parameter of action
*/
router.post('/', function(req, res, next) {
  var themeName = req.query.name
  var newScss, //合并所有变量
      newPrimary,
      newWarning,
      newHeaderBg;
  //深蓝色
  if(themeName ==='darkblue'){
    newPrimary = sassVariable('brand-primary', '#00f')
    newWarning = sassVariable('brand-warning', '#f00')
    newHeaderBg = sassVariable('header-bg', '#00f') 
  }
  //红色
  if(themeName === 'red'){
    newPrimary = sassVariable('brand-primary', '#f00')
    newWarning = sassVariable('brand-warning', '#ff0')
    newHeaderBg = sassVariable('header-bg', '#f00') 
  }
  
  newScss = newPrimary + newWarning + newHeaderBg
  
  //写入_custom.scss
  fs.writeFile('sass/_custom.scss', newScss) 
  
  //变量组合
  function sassVariable(name, value) {
    return "$" + name + ": " + value + ";"
  }
  //返回上一级目录
  res.sendFile( path.resolve(__dirname, '../creator.html'))
})

module.exports = router
