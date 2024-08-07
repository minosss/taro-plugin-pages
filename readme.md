# taro-plugin-pages

[![NPM version](https://img.shields.io/npm/v/@yme/taro-plugin-pages)](https://www.npmjs.com/package/@yme/taro-plugin-pages)
[![NPM Downloads](https://img.shields.io/npm/dm/@yme/taro-plugin-pages)](https://www.npmjs.com/package/@yme/taro-plugin-pages)

> taro-plugin-pages 是一个用于 Taro 的插件，用于自动生成 pages 配置。

**注意: `0.1.0` 开始使用了 `/* pages start */` 的标识来替换页面内容**

1. 自动更新 `app.config.ts` 下的 `pages` 字段。可以关闭格式化，避免文件每次都更新。

```js
export default defineAppConfig({
  /* eslint-disable */
  /* pages start */
  pages: [
    'pages/home/page',
    'pages/launch/page',
    'pages/auth/login/page',
    'pages/auth/register/page',
  ],
  /* pages end */
  /* eslint-enable */
});
```

2. 自动更新 `utils/pages.ts` 文件。根据文件夹层级生成对象。

```js
/* eslint-disable */
/* prettier-ignore */
// @ts-nocheck
// 由组件 generate-pages 生成，不要改
export default {
  "home": "/pages/home/page",
  "launch": "/pages/launch/page",
  "auth": {
    "login": "/pages/auth/login/page",
    "register": "/pages/auth/register/page"
  }
} as const;
```

3. 分包配置

在配置文件中添加 subPackages 字段

- 分包目录需在页面目录下，比如 `pages/@xx`
- 分包使用前缀 `@` `@@` 标志
- `@` 分包
- `@@` 独立分包，有 `independent`
- 分包的前缀不会在页面对象中显示，`@` 会被换成 `_`，方便这样 `pages.__sub.your.page` 的格式

```js
export default defineAppConfig({
  /* subPackages start */
  subPackages: [],
  /* subPackages end */
});
```

## 安装

```bash
npm i @yme/taro-plugin-pages -D
```

## 使用

在 `config/index.js` 中配置插件，如果你没用 ts 需要自定义配置

```js
{
  plugins: [
    ['@yme/taro-plugin-pages', {
      // 通常都不需要改
      // 页面存放的目录
      // dir: 'pages',
      // 页面的文件名
      // pageName: 'page.vue',
      // 页面对象的储存文件
      // pagesName: 'utils/pages.ts',
      // 应用页面配置文件
      // appConfigName: 'app.config.ts',
    }]
  ]
}
```
