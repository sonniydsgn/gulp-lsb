const {src, dest, series, watch} = require('gulp'),
      autoprefixer = require('gulp-autoprefixer'),
      babel = require('gulp-babel'),
      cleanCSS = require('gulp-clean-css'),
      uglify = require('gulp-uglify-es').default,
      del = require('del'),
      browserSync = require('browser-sync').create(),
      sass = require('gulp-sass')(require('sass')),
      fileInclude = require('gulp-file-include'),
      sourcemaps = require('gulp-sourcemaps'),
      rev = require('gulp-rev'),
      revRewrite = require('gulp-rev-rewrite'),
      revDel = require('gulp-rev-delete-original'),
      htmlmin = require('gulp-htmlmin'),
      gulpif = require('gulp-if'),
      notify = require('gulp-notify'),
      image = require("gulp-image"),
      { readFileSync } = require('fs'),
      concat = require('gulp-concat');

let isProd = false; // dev by default

const clean = () => {
	return del(['app/*'])
}

const styles = () => {
  return src('./src/scss/**/*.scss')
    .pipe(gulpif(!isProd, sourcemaps.init()))
    .pipe(sass().on("error", notify.onError()))
    .pipe(autoprefixer({
      cascade: false,
    }))
    .pipe(gulpif(isProd, cleanCSS({ level: 2 })))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(dest('./app/css/'))
    .pipe(browserSync.stream());
};

const stylesBackend = () => {
	return src('./src/scss/**/*.scss')
		.pipe(sass().on("error", notify.onError()))
    .pipe(autoprefixer({
      cascade: false,
		}))
		.pipe(dest('./app/css/'))
};

const scripts = () => {
  return src(
    ['./src/js/vendor/**.js', './src/js/components/**.js', './src/js/app.js'])
    .pipe(gulpif(!isProd, sourcemaps.init()))
		.pipe(babel({
			presets: ['@babel/env']
		}))
    .pipe(concat('app.js'))
    .pipe(gulpif(isProd, uglify().on("error", notify.onError())))
    .pipe(gulpif(!isProd, sourcemaps.write('.')))
    .pipe(dest('./app/js'))
    .pipe(browserSync.stream());
}

const scriptsBackend = () => {
	return src(['./src/js/vendor/**.js', './src/js/components/**.js', './src/js/app.js'])
    .pipe(dest('./app/js'))
};

const fonts = () => {
  return src('./src/fonts/*')
    .pipe(dest('./app/fonts'))
}

const images = () => {
  return src([
		'./src/img/**/*.+(png|jpg|gif|ico|svg|webp)'
		])
    .pipe(gulpif(isProd, 
      image({
        svgo: ['--disable', 'cleanupIDs']
      })
    ))
    .pipe(dest('./app/img'))
};

const htmlInclude = () => {
  return src(['./src/*.html'])
    .pipe(fileInclude({
      prefix: '@',
      basepath: '@file'
    }))
    .pipe(dest('./app'))
    .pipe(browserSync.stream());
}

const watchFiles = () => {
  browserSync.init({
    server: {
      baseDir: "./app"
    },
    port: 3000,
		notify: false
  });

  watch('./src/scss/**/*.scss', styles);
  watch('./src/js/**/*.js', scripts);
  watch('./src/partials/*.html', htmlInclude);
  watch('./src/*.html', htmlInclude);
  watch('./src/fonts/**', fonts);
  watch('./src/img/**/*.+(png|jpg|gif|ico|svg|webp)', images);
}

const cache = () => {
  return src('app/**/*.{css,js,svg,png,jpg,jpeg,woff2}', {
    base: 'app'})
    .pipe(rev())
    .pipe(revDel())
		.pipe(dest('app'))
    .pipe(rev.manifest('rev.json'))
    .pipe(dest('app'));
};

const rewrite = () => {
  const manifest = readFileSync('app/rev.json');
	src('app/css/*.css')
		.pipe(revRewrite({
      manifest
    }))
		.pipe(dest('app/css'));
  return src('app/**/*.html')
    .pipe(revRewrite({
      manifest
    }))
    .pipe(dest('app'));
}

const htmlMinify = () => {
	return src('app/**/*.html')
		.pipe(htmlmin({
      removeComments: true,
			collapseWhitespace: true
		}))
		.pipe(dest('app'));
}

const toProd = (done) => {
  isProd = true;
  done();
};

exports.default = series(clean, htmlInclude, scripts, styles, fonts, images, watchFiles);

exports.build = series(toProd, clean, htmlInclude, scripts, styles, fonts, images, htmlMinify);

exports.cache = series(cache, rewrite);

exports.backend = series(toProd, clean, htmlInclude, scriptsBackend, stylesBackend, fonts, images);