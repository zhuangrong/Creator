var express = require('express')
var sassMiddleware = require('node-sass-middleware')
var fs=require('fs')  
var path = require('path')
var favicon = require('serve-favicon')
var logger = require('morgan')
var cookieParser = require('cookie-parser')
var bodyParser = require('body-parser');
var archiver = require('archiver')
var beautify_html = require('js-beautify').html
var beautify_css = require('js-beautify').css

var index = require('./routes/index')
var users = require('./routes/users')
var login = require('./routes/login')
var preview = require('./routes/preview')
var theme = require('./routes/theme')

var app = express()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())



//user node-sass-middleware
app.use(
  sassMiddleware({
    src: __dirname + '/sass',
    dest: __dirname + '/public/stylesheets',  //path of output
    prefix:  '/stylesheets',  // the sass middleware will look for the file /sass/app.scss rather than /sass/stylesheets/app.scss.
    debug: true,
  })
)

app.use(express.static(path.join(__dirname, 'public')))

/*=============================
  首页creator.html
  =============================*/

app.get('/', function(req, res){
   res.sendFile(__dirname + '/creator.html')
})

//默认主题颜色
var defaultTheme = { 'primary': "#008AD5", 'warning': "#E64340" , 'success': "#09BB07" , 'secondary': "#FFBE00" , 'line': "#dedede" , 'grayLight': "#999",
                     'headerBg': "#fff", 'bodyBg': "#f7f7f9", 'textColor': "#000", 'tabbarBg': "#dedede",
                     'borderRadius': "5px" }
//点击"save"后的自定义样式
var newTheme = {}

/*custom theme color*/
app.post('/themeCustom', function(req, res, next) {
  //获取表单请求，修改颜色变量
  //Theme Color
  newTheme.primary = req.body.primary || '#008AD5'
  newTheme.warning = req.body.warning || '#E64340'
  newTheme.success = req.body.success || '#09BB07'
  newTheme.secondary = req.body.secondary || '#FFBE00'
  newTheme.line = req.body.line || '#dedede'
  newTheme.grayLight = req.body.grayLight || '#999'
  //Page and Header
  newTheme.headerBg = req.body.headerBg || '#fff'
  newTheme.bodyBg = req.body.bodyBg || '#f7f7f9'
  newTheme.textColor = req.body.textColor || '#000'
  newTheme.tabbarBg = req.body.tabbarBg || '#dedede'
  //Typography
  newTheme.borderRadius = req.body.borderRadius || '5px'
  
  //生成scss变量
  var newPrimary = sassVariable('brand-primary', newTheme.primary)
  var newWarning = sassVariable('brand-warning', newTheme.warning)  
  var newSuccess = sassVariable('brand-success', newTheme.success)
  var newSecondary = sassVariable('brand-secondary', newTheme.secondary)
  var newLine = sassVariable('gray-lighter', newTheme.line)
  var newGrayLight = sassVariable('gray-light', newTheme.grayLight)
  
  var newHeaderBg = sassVariable('header-bg', newTheme.headerBg)  
  var newBodyBg = sassVariable('body-bg', newTheme.bodyBg)  
  var newTextColor = sassVariable('body-color', newTheme.textColor)  
  var newTabbarBg = sassVariable('tabbar-bg', newTheme.tabbarBg) 
  
  var newBorderRadius = sassVariable('border-radius', newTheme.borderRadius) 
  
  var newScss = newPrimary + newWarning + newSuccess + newSecondary + newLine + newGrayLight + newHeaderBg + newBodyBg + newTextColor + newTabbarBg + newBorderRadius
  
  //写入_custom.scss
  fs.writeFile('sass/_custom.scss', newScss) 
  
  //变量组合
  function sassVariable(name, value) {
    return "$" + name + ": " + value + ";"
  }
    
  // res.sendFile(__dirname + '/creator.html')
  // url重定向到首页
  res.redirect("http://10.168.1.91:3000")
})

/*output 保存页面html到服务器  压缩zip*/
app.post('/output', function(req, res){
  var pagehtmlNew = req.body.pagehtml
  var pagenameNew = req.body.pagename
  var pagecssNew = req.body.pagecss
  var contentHead = `<!DOCTYPE html>
<html lang="zh-cn">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no" />
<title>creator</title>
<link rel="stylesheet" href="global.css">
<link rel="stylesheet" href="smui.css">
<link rel="stylesheet" href="css/output.css">
<script src="jquery-2.1.4.min.js"></script>
</head>
<body>
`
  
  var contentFooter = `
</body>
</html>
`  
  //先删除output文件夹下的所有文件，避免客户端page删除或重命名引起的文件冗余 
  var emptyDir = function(fileUrl){
      var files = fs.readdirSync(fileUrl);//读取该文件夹
      files.forEach(function(file){
          var stats = fs.statSync(fileUrl+'/'+file)
          if(stats.isDirectory()){
              emptyDir(fileUrl+'/'+file)
          }else{
              fs.unlinkSync(fileUrl+'/'+file)
          }
      })
  }
  emptyDir(__dirname + '/output') 
  
  //保存html 
  if(typeof (pagehtmlNew) == 'string'){
    var htmlAll = contentHead + pagehtmlNew + contentFooter
    //js-beautify
    htmlAll = beautify_html(htmlAll, { "indent_size": 2,
                                           "extra_liners": [],
                                           "unformatted": ['span', 'label', 'b', 'strong', 'h1', 'h3', 'pre']  //unformatted (defaults to inline tags),if tag not in [] ,so it is not inline, example "a"
                                         })
        
    fs.writeFile('output/'+ pagenameNew  +'.html', htmlAll,function(err){
        if (err) throw err
    })
    
  }else{
    for (var i=0; i<pagehtmlNew.length; i++){
      var htmlAll2 = contentHead + pagehtmlNew[i] + contentFooter
      //js-beautify
      htmlAll2 = beautify_html(htmlAll2, { "indent_size": 2,
                                         "extra_liners": [],
                                         "unformatted": ['span', 'label', 'b', 'strong', 'h1', 'h3', 'pre']  
                                       })
      //相同name的page，重命名
      if (pagenameNew.indexOf(pagenameNew[i]) != i) {
        pagenameNew[i] = pagenameNew[i] + "(" + (i + 1) + ")"
      }
      
      fs.writeFile('output/'+ pagenameNew[i] +'.html', htmlAll2, function(err){
        if (err) throw err
      }) 
    }
  
  }
  //js-beautify
  pagecssNew = beautify_css(pagecssNew, { "indent_size": 2, "newline_between_rules": false})
  fs.writeFile('output/css/output.css', pagecssNew,function(err){ if (err) throw err}) 
  
  
  
  //zip
  var output = fs.createWriteStream(__dirname + '/smui-www.zip')
  var archive = archiver('zip', {
      zlib: { level: 9 } 
  })
  output.on('close', function() {
    console.log(archive.pointer() + ' total bytes')
    console.log('archiver has been finalized and the output file descriptor has closed.')
  })
  archive.on('error', function(err) {
    throw err
  })   
  archive.pipe(output)
  
  var smuiCss = __dirname + '/public/stylesheets/smui.css'
  var globalCss = __dirname + '/public/stylesheets/global.css'
  var jquery = __dirname + '/public/javascripts/jquery-2.1.4.min.js'
  var readme = __dirname + '/public/README.txt'
  archive.append(fs.createReadStream(smuiCss), { name: 'smui.css' })
  archive.append(fs.createReadStream(globalCss), { name: 'global.css' })
  archive.append(fs.createReadStream(jquery), { name: 'jquery-2.1.4.min.js' })
  archive.append(fs.createReadStream(readme), { name: 'README.txt' })
  archive.directory('output/', false)
  archive.finalize()
  
  res.sendFile(__dirname + '/routes/output.html')
})

//download zip
app.get('/download', function(req, res){
  var file = __dirname + '/smui-www.zip';
  res.download(file); // Set disposition and send it.
});

//在custom theme窗口点击关闭或取消时返回服务器上的theme变量
app.post('/cancelTheme', function(req, res){
     res.send(newTheme)
})

//Restore defaults theme 恢复默认样式 
app.post('/restoreDefaults', function(req, res, next){
  
  //读取默认样式文件，并写入到_custom.scss中
  var rsCss = fs.createReadStream(__dirname + '/sass/themes/default/theme.scss')
  var wsCss = fs.createWriteStream(__dirname + '/sass/_custom.scss')
  rsCss.pipe(wsCss)
  
  //返回默认值，把默认样式作为定义一个常量，新的提交的颜色值作为变量对象
  res.send(defaultTheme)
  
  //克隆对象方法
  function cloneObj(a) {
     return JSON.parse(JSON.stringify(a))
  }
  //defaultTheme复制给newTheme，将服务器上的primary值为默认的，而且防止theme窗口在点取消或关闭的时候还是新值
  newTheme = cloneObj(defaultTheme)
    
})

app.use('/preview', preview)
app.use('/theme', theme)
app.use('/login', login)
app.use('/users', users)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  
  // render the error page
  res.status(err.status || 500);
  res.render('error');
  
});

module.exports = app;
