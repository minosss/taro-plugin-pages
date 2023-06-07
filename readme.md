# taro-plugin-pages

> taro-plugin-pages 是一个用于 Taro 的插件，用于自动生成 pages 配置。

1. 自动更新 `app.config.ts` 下的 `pages` 字段。可以关闭格式化，避免文件每次都更新。

**注意: 有 _ 的文件名或目录名会过滤掉，不是文件开头**

```js
export default defineAppConfig({
  /* eslint-disable */
  pages: [
    'pages/home/page',
    'pages/launch/page',
    'pages/auth/login/page',
    'pages/auth/register/page',
  ],
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
  "home": "/pages/home/page.vue",
  "launch": "/pages/launch/page.vue",
  "auth": {
    "login": "/pages/auth/login/page.vue",
    "register": "/pages/auth/register/page.vue"
  }
} as const;
```

## 安装

```bash
npm i @yme/taro-plugin-pages -D
```

## 使用

在 `config/index.js` 中配置插件，如果你没用 ts 需要自定义配置

```js
...
  plugins: [
    ['@yme/taro-plugin-pages', {
      // 都基于项目的 sourcePath 目录
      // 页面存放的目录
      dir: 'pages',
      // 页面的文件名
      pageName: 'page.vue', // 或者 page.tsx 根据 framework 判断
      // 页面对象的储存文件
      pagesName: 'utils/pages.ts',
      // 应用页面配置文件
      appConfigName: 'app.config.ts',
    }]
  ]
...
```
