const fs = require('node:fs');
const path = require('node:path');
const glob = require('fast-glob');

function generate({
  cwd,
  dir = 'pages',
  appConfigName = 'app.config.ts',
  pagesName = 'utils/pages.ts',
  pageName = 'page.vue',
}) {
  const extention = path.extname(pageName);
  let pages = glob.sync(`${dir}/**/${pageName}`, {
    ignore: ['node_modules'],
    onlyFiles: true,
    cwd,
  });

  // 下划线 _ 开头的就过滤掉
  pages = pages.filter((page) => !page.startsWith('_'));

  const appConfigPath = path.resolve(cwd, appConfigName);
  const appPages = pages.map((page) => page.replace(extention, ''));
  //
  let appConfig = fs.readFileSync(appConfigPath, { encoding: 'utf8' });
  appConfig = appConfig.replaceAll(/pages: \[(.|\n|\r|\t)*?]/gm, `pages: [\n${appPages.map((page) => `    '${page}'`).join(',\n')},\n  ]`);
  fs.writeFileSync(appConfigPath, appConfig, { encoding: 'utf8' });
  console.log(`${appConfigName} 已更新`);

  // 生成 pages 对象
  const pagesPath = path.resolve(cwd, pagesName);
  // convert pages to object, nested with folder name
  // eslint-disable-next-line unicorn/no-array-reduce
  const pagesObject = appPages.reduce((acc, currentPage) => {
    // 分割文件夹路径
    const pagePathArray = currentPage.split('/');
    // 去头去尾
    pagePathArray.shift(); // 第一个是 pages
    pagePathArray.pop(); // 最后一个是文件名

    // 最后一个是最终页面名称
    const name = pagePathArray.pop();
    // 以 _ 开头的文件夹和文件不作为页面
    let obj = acc;
    // 剩余的路径当作层级
    for (const p of pagePathArray) {
      obj[p] = obj[p] || {};
      obj = obj[p];
    }
    // 用顶层路径 `/` 开头
    obj[name] = `/${currentPage}`;
    return acc;
  }, {});
  // 写到文件中 utils/pages.ts
  const pagesContent = `/* eslint-disable */\n/* prettier-ignore */\n// @ts-nocheck\n// 由组件 @yme/taro-plugin-pages 生成，不要改\nexport default ${JSON.stringify(pagesObject, null, 2)} as const;`;
  fs.writeFileSync(pagesPath, pagesContent, { encoding: 'utf8' });
  console.log(`${pagesName} 已更新`);
}

module.exports = function (ctx, options = {}) {
  // 在编译前扫描 pages 目录，生成页面路径到 app.config.ts 中
  ctx.onBuildStart(() => {
    const { dir = 'pages', pageName, pagesName, appConfigName } = options;
    const { chokidar } = ctx.helper;
    const { options: { isWatch }, config: { framework = '' } } = ctx.runOpts;

    const _pageName = pageName || framework.includes('vue') ? 'page.vue' : 'page.tsx';
    const regenerate = () => {
      generate({
        dir,
        cwd: ctx.paths.sourcePath,
        pageName: _pageName,
        pagesName,
        appConfigName,
      });
    };

    regenerate();

    if (isWatch) {
      console.log(`正在侦听 ${dir} 目录变化`);
      chokidar
        .watch(dir, {
          cwd: ctx.paths.sourcePath,
          ignoreInitial: true,
        })
        .on('add', regenerate)
        .on('change', regenerate)
        .on('unlink', regenerate);
    }
  });
};
