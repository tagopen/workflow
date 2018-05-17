'use strict'

// package vars
const pkg = require("./package.json")

// gulp
import gulp             from 'gulp'

// load all plugins in "devDependencies" into the variable $
const $ = require('gulp-load-plugins')({
  DEBUG: false,
  scope: ['devDependencies'],
  pattern: ['*'],
  lazy: true,
  rename: { 'vinyl-buffer'        : 'buffer',
            'vinyl-source-stream' : 'soufrce' }
})

const onError = (err) => {
  console.log(err)
}

// .gitconfig vars
const gitconfig = $.gitConfig.sync()

// uglified & compressed when type '--producton' behind gulp init command
const prod    = !!$.util.env.production
console.log('production: ' + $.util.env.production)

// sass - build the sass to the build folder, including the required paths, and writing out a sourcemap
gulp.task("sass", () => {
  $.fancyLog("-> Building sass")
  return gulp.src([pkg.path.watch.sass])
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.plumberNotifier())
    .pipe($.sourcemaps.init({loadMaps: true}))
    .pipe($.sass({
      css: pkg.path.src.css,
      sass: pkg.path.src.sass,
      image: pkg.path.src.img,
      outputStyle: 'expanded'
    })
    .on("error", $.sass.logError))
    .pipe($.cached("sass_compile"))
    .pipe($.autoprefixer(['last 15 versions', '>1%', 'ie 10'], {cascade: true}))
    .pipe($.sourcemaps.write("./"))
    .pipe(gulp.dest(pkg.path.build.css))
    .pipe($.browserSync.stream())
})

gulp.task("css", ["sass"], () => {
  const cssnanoConfig = {
    discardComments: true,
    discardEmpty: true,
    discardUnused: { fontFace: false },
    minifyFontValues: false,
    zindex: false
  }

  $.fancyLog("-> Building css")
  return gulp.src([pkg.path.watch.css, pkg.path.build.css + "*.css"])
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.plumberNotifier())
    .pipe($.newer({dest: pkg.path.dist.css}))
    .pipe($.cssnano(cssnanoConfig))
    .pipe(gulp.dest(pkg.path.dist.css))
    .pipe(prod ? $.rename({suffix: '.min', prefix : ''}) : $.util.noop())
    .pipe(prod ? $.header(banner, {pkg: pkg}) : $.util.noop())
    .pipe(prod ? $.size({gzip: true, showFiles: true}) : $.util.noop())
    .pipe(prod ? gulp.dest(pkg.path.dist.css) : $.util.noop())
    .pipe($.browserSync.stream())
})

// babel js task - transpile our Javascript into the build directory
gulp.task("js-babel", () => {
  $.fancyLog("-> Transpiling Javascript via Babel...")
  return gulp.src(pkg.globs.babelJs)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.plumberNotifier())
    .pipe($.newer({dest: pkg.path.watch.js}))
    .pipe($.babel())
    .pipe($.prettier({ singleQuote: true }))
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(pkg.path.dist.js))
})

// inline js task - minimize the inline Javascript into _inlinejs in the templates path
gulp.task("js-inline", () => {
  $.fancyLog("-> Copying inline js")
  return gulp.src(pkg.globs.inlineJs)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.plumberNotifier())
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(pkg.path.dist.js))
})

// js task - minimize any distribution Javascript into the public js folder, and add our banner to it
gulp.task("js", ["js-babel", "js-inline"], () => {
  $.fancyLog("-> Building js")
  return gulp.src(pkg.globs.distJs)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.plumberNotifier())
    .pipe($.if(["*.js", "!*.min.js"],
      $.newer({dest: pkg.path.dist.js, ext: ".min.js"}),
      $.newer({dest: pkg.path.dist.js})
    ))
    .pipe($.if(["*.js", "!*.min.js"],
      $.uglifyjs()
    ))
    .pipe($.concat({path: 'plugins.min.js', cwd: ''}) )
    .pipe($.size({gzip: true, showFiles: true}))
    .pipe(gulp.dest(pkg.path.dist.js))
    .pipe(prod ? $.uglifyjs() : $.util.noop())
    .pipe(prod ? $.rename({suffix: '.min', prefix : ''}) : $.util.noop())
    .pipe(prod ? $.header(banner, {pkg: pkg}) : $.util.noop())
    .pipe(prod ? $.size({gzip: true, showFiles: true}) : $.util.noop())
    .pipe(prod ? gulp.dest(pkg.path.dist.js) : $.util.noop())
    .pipe($.browserSync.stream())
})


gulp.task('pug', () => {
  const options = {
    collapseWhitespace:               true, 
    collapseInlineTagWhitespace:      true,
    removeAttributeQuotes:            true,
    conservativeCollapse:             true,
    processConditionalComments:       true, 
    removeComments:                   true,
    removeEmptyAttributes:            true,
    sortAttributes:                   true,
    sortClassName:                    true,
    removeStyleLinkTypeAttributes:    true,
    removeScriptTypeAttributes:       true,
    minifyJS:                         true,
    minifyCSS:                        true
  }

  const useminOptions = {
    js: {
        suffix: '.min',
        enable: true
    },
    css: {
        suffix: '.min',
        enable: true
    }
  }

  const htmlVersionOptions = {
    paramName: 'v',
    paramType: 'timestamp',
  }

  $.fancyLog("-> Building pug")
  return gulp.src(pkg.path.watch.pug)
  .pipe($.plumber({errorHandler: onError}))
  .pipe($.plumberNotifier())
  .pipe($.data(function (file) {
    return {
      relativePath: file.history[0].replace(file.base, '').split(".")[0]
    }
  }))
  .pipe($.pug({
    basedir:     pkg.path.src.pug,
    pretty:      true
  }))
  .pipe($.htmlVersion(htmlVersionOptions))
  .pipe(prod ? $.useminHtml(useminOptions) : $.util.noop())
  .pipe(prod ? $.htmlMinifier(options) : $.util.noop())
  .pipe(gulp.dest(pkg.path.dist.html))
})

// create a task that ensures the `js` task is complete before
// reloading browsers
gulp.task('pug:watch', ['pug'], function(done) {
  $.browserSync.reload()
  done()
})

gulp.task('fontawesome', () => {
 return gulp.src([pkg.path.watch.fontawesome])
   .pipe(gulp.dest(pkg.path.dist.fonts))
})

gulp.task('fonts', ['fontawesome'], () => {
 return gulp.src([pkg.path.watch.fonts])
   .pipe($.font2css.default())
   .pipe($.concat({path: 'fonts.css', cwd: ''}))
   .pipe(gulp.dest(pkg.path.dist.css))
   .pipe($.browserSync.stream())
})

gulp.task('sprite', function() {
  gulp.src(pkg.path.watch.spritePng)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.plumberNotifier())
    .pipe($.spritesmith({
      imgName: 'sprite.png',
      //retinaSrcFilter: ['app/img/icons/*@2x.png'],
      //retinaImgName: 'sprite@2x.png',
      cssName: '_sprite.sass',
      cssFormat: 'sass',
      padding: 10
    }))
    .pipe($.if('*.png', 
      gulp.dest(pkg.path.src.img)
    ))
    .pipe($.if('*.css', 
      $.replace(/^\.icon-/gm, '.ic--'), 
      gulp.dest(pkg.path.src.sprite)
    ))
})

gulp.task('svg', function () {
 return gulp.src(pkg.path.watch.spriteSvg)
    .pipe($.plumber({errorHandler: onError}))
    .pipe($.plumberNotifier())
    .pipe($.svgmin({
      js2svg: {
        pretty: true
      }
    }))
    .pipe($.cheerio({
      run: function ($) {
        //$('[fill]').removeAttr('fill')
        //$('[stroke]').removeAttr('stroke')
        $('[style]').removeAttr('style')
      },
      parserOptions: {xmlMode: true}
    }))
    .pipe($.replace('&gt', '>'))
    // build svg sprite
   .pipe($.svgSprite({
    shape: {
      spacing: {
        padding: 0,
      },
      dimension   : {     // Set maximum dimensions
        maxWidth  : 32,
        maxHeight : 32,
      },
    },
    mode: {
      view: false,
      symbol: {
        dest: "./",
        layout: "packed",
        sprite: "sprite.svg",
        bust: false,
        render: {
          scss: {
            //dest: "../app/sass/utils/_spriteSvg.scss",
            template: pkg.path.src.svgTemplate
          }
        }
      },
      inline: true,
    },
    variables: {
      mapname: "icons"
    }
  }))
   .pipe(gulp.dest(pkg.path.dist.img))
})

gulp.task('server', function() {
  $.browserSync({
    server: {
      baseDir: pkg.path.dist.base,
      reloadDelay: 2000,
      browser: "google chrome"
    },
    notify: false
  })
})

// Generate & Inline Critical-path CSS
gulp.task('critical', function() {
  return gulp.src(path.build.html)
    .pipe($.critical.stream({
      base: 'dist/',
      inline: true,
      dimensions: [{
        width: 320,
        height: 480
      }, {
        width: 768,
        height: 1024
      }, {
        width: 1280,
        height: 960
      }],
      css: [path.build.critical],
      minify: true,
      extract: false,
      ignore: ['font-face']
    }))
    .pipe(gulp.dest(dirs.dest))
})

gulp.task('clean', function () {
  return $.del.sync([pkg.path.dist.base, pkg.path.build.base])
})

gulp.task('clear', function () {
  return $.cache.clearAll()
})

gulp.task('htaccess:build', () => {
  gulp.src(pkg.path.src.htaccess)
    .pipe(gulp.dest(pkg.path.dist.htaccess))
})

gulp.task('sitemap', () => {
  gulp.src(pkg.path.src.sitemap)
    .pipe(gulp.dest(pkg.path.dist))
})

gulp.task('mail:build', () => {
  gulp.src(pkg.path.watch.mail)
    .pipe(gulp.dest(pkg.path.dist.mail))
})

// imagemin task

/*gulp.task('img', function() {
  return gulp.src(path.watch.img)
    .pipe($.plumber())
    .pipe($.plumberNotifier())
    .pipe($.cache($.imagemin({
      interlaced: true,
      progressive: true,
      svgoPlugins: [{
        removeViewBox: false
      }],
      use: [pngquant()]
    })))
    .pipe(gulp.dest(path.build.img))
})*/

gulp.task("svgmin", () => {
  return gulp.src([pkg.path.watch.svg])
    .pipe($.plumber())
    .pipe($.plumberNotifier())
    .pipe($.cache($.imagemin({
        interlaced: true,
        progressive: true,
        svgoPlugins: [{
        removeViewBox: false
      }],
    })))
    .pipe(gulp.dest(pkg.path.dist.img))
})

gulp.task("imagemin", ["svgmin"], () => {
  return gulp.src([pkg.path.watch.img])
    .pipe($.plumber())
    .pipe($.plumberNotifier())
    .pipe($.newer({dest: pkg.path.dist.img}))
    .pipe($.tinypngNokey({
    }))
    .pipe(gulp.dest(pkg.path.dist.img))
})

gulp.task('ftp', () => {

  const conn = $.vinylFtp.create({
    host:       gitconfig.ftp.host,
    user:       gitconfig.ftp.login,
    password:   gitconfig.ftp.password,
    secure:     false,
    parallel:   3,
    log:        $.util.log
  })

  const dest = gitconfig.ftp.path + pkg.name

  return gulp.src( [pkg.path.dist.base + pkg.path.coFiles], { base: pkg.path.dist.base, buffer: false } )
   // .pipe(conn.clean(dest)) // remove files
    .pipe(conn.newer(dest)) // only upload newer files 
    .pipe(conn.dest(dest))
})

gulp.task('test', () => {
  console.log($)
})

// watch
gulp.task('watch', () => {

  $.watch([pkg.path.watch.spritePng], function(event, cb) {
    gulp.start('sprite')
  })

  $.watch([pkg.path.watch.spriteSvg], function(event, cb) {
    gulp.start('svg')
  })
  
  $.watch([pkg.path.watch.sass], function(event, cb) {
    gulp.start('css')
  })

  $.watch([pkg.path.watch.js], function(event, cb) {
    gulp.start('js')
  })

  $.watch([pkg.path.watch.img, pkg.path.watch.svg], function(event, cb) {
    gulp.start('imagemin')
  })
  $.watch([pkg.path.watch.template], function(event, cb) {
    gulp.start('pug:watch')
  })

  $.watch([pkg.path.watch.fonts], function(event, cb) {
    gulp.start('fonts')
  })

})

gulp.task('dev', ['clean', 'pug', 'fonts', 'sprite', 'img', 'sass', 'scripts'], () => {

  let buildmail = gulp.src(path.watch.mail)
    .pipe(gulp.dest(path.build.mail))

  return gulp.src(path.watch.html)
    .pipe($.plumber({
      handleError: function(err) {
        console.log(err)
        this.emit('end')
      }
    }))
    .pipe($.plumberNotifier())
    .pipe($.useref({
      searchPath: dirs.src
    }))
    .pipe($.if(
      '*.js', $.uglifyjs()
    ))
    .pipe($.if(
      '*.css', $.cssnano({
        discardComments: {
          removeAll: true
        }
      })
    ))
    .pipe($.if(
      '*.html', $.htmlMinifier({
        collapseWhitespace: true,
        collapseInlineTagWhitespace: true,
        removeAttributeQuotes: true,
        conservativeCollapse: true,
        processConditionalComments: true,
        removeComments: true,
        removeEmptyAttributes: true,
        sortAttributes: true,
        sortClassName: true,
        removeStyleLinkTypeAttributes: true,
        removeScriptTypeAttributes: true,
        minifyJS: true,
        minifyCSS: true
      })
    ))
    .pipe(gulp.dest(dirs.dest))
})

gulp.task('build', [
  'clean',
  'sprite',
  'svg',
  'pug',
  'fonts',
  'css',
  'js',
  'imagemin'
])

gulp.task('default', ['build', 'watch', 'server'])
