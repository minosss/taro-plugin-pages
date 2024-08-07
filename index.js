const fs = require('node:fs');
const path = require('node:path');
const glob = require('fast-glob');

function generate({
  cwd,
  // 页面的文件夹
  dir = 'pages',
  // 配置文件名
  appConfigName = 'app.config.ts',
  // 页面对象的文件名
  pagesName = 'utils/pages.ts',
  // 页面文件名
  pageName = 'page.tsx',
}) {
  const extention = path.extname(pageName);

  // 扫描页面目录，获取所有页面
  const pages = glob.sync(`${dir}/**/${pageName}`, {
    ignore: ['node_modules'],
    onlyFiles: true,
    cwd,
  });

  const appConfigPath = path.resolve(cwd, appConfigName);

  // 页面不需要后缀，不过需要文件名 /pages/xxx/page.tsx 转换成 /pages/xxx/page
  const appPages = pages.map((page) => page.replace(extention, ''));

  // sub-package 获取分包的目录 `${dir}/@xxx/`
  // 分包使用在目录下的第一层且已 @ 开头的文件夹
  // 分包有另外一个中独立包，由 independent 标记，已 @@ 开头的文件夹会设置 independent: true
  const subPages = appPages.filter((page) => page.startsWith(`${dir}/@`));

  // 这些是主包的页面
  const mainPages = appPages.filter((page) => !subPages.includes(page));

  // 分组，用前两个目录来分组 /pages/{sub}
  const groupedSubPackages = subPages.reduce((acc, currentPage) => {
    const [root, sub, ...others] = currentPage.split('/');
    const subRoot = `${root}/${sub}`;
    // 确保分包的目录存在
    acc[subRoot] = acc[subRoot] ?? { root: subRoot, pages: [] };
    // 将子页面放到分包的目录中
    acc[subRoot].pages.push(others.join('/'));
    return acc;
 }, {});

  const tabLevel = `\t\t`;
  const subPackages = Object.values(groupedSubPackages).map(({ root, pages }) => {
    const independent = root.includes('@@') ? `\n${tabLevel}\tindependent: true,` : '';
    return [
      `${tabLevel}{`,
      `${tabLevel}\troot: '${root}',`,
      `${tabLevel}\tpages: [`,
      // 分包的页面没有换行
      `${tabLevel}\t\t${pages.map((page) => `'${page}'`).join(', ')}`,
      `${tabLevel}\t],${independent}`,
      `${tabLevel}}`,
    ].join('\n');
  });

  let appConfig = fs.readFileSync(appConfigPath, { encoding: 'utf8' });

  // 写入页面 pages 到 app.config.ts
  appConfig = appConfig.replaceAll(
    /(\/\* pages start \*\/)(.*?)(\/\* pages end \*\/)/gms,
    // 只替换内容
    `$1\n\tpages: [\n${mainPages.map((page) => `\t\t'${page}'`).join(',\n')},\n\t],\n\t$3`
  );

  // 写入分包的目录
  appConfig = appConfig.replaceAll(
    /(\/\* subPackages start \*\/)(.*?)(\/\* subPackages end \*\/)/gms,
    // 只替换内容
    `$1\n\tsubPackages: [\n${subPackages.map((sub) => `${sub}`).join(',\n')},\n\t],\n\t$3`
  );

  // 更新 app.config.ts
  fs.writeFileSync(appConfigPath, appConfig, { encoding: 'utf8' });
  console.log(`${appConfigName} 已更新`);

  // 生成 pages 对象，方便在跳转的时候获取页面路径
  const pagesPath = path.resolve(cwd, pagesName);
  // convert pages to object, nested with folder name
  // eslint-disable-next-line unicorn/no-array-reduce
  const pagesObject = appPages.reduce((acc, currentPage) => {
    // 分割文件夹路径
    const pagePathArray = currentPage.split('/');
    // 去头去尾
    pagePathArray.shift(); // 第一个是 pages
    pagePathArray.pop(); // 最后一个是文件名

    const formatPages = pagePathArray.map(
      (page) =>
        page
          // 去掉 -_ 变成驼峰
          .replace(/[-_]([a-z])/g, (g) => g[1].toUpperCase())
          // 去掉 @，方便用 . 取值
          .replace(/@/g, ''),
    );
    // 最后一个是最终页面名称
    const name = formatPages.pop();
    let obj = acc;
    // 剩余的路径当作层级
    for (const p of formatPages) {
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
