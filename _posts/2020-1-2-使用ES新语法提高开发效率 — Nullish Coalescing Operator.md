---
layout: post
title: 使用ES新语法提高开发效率 — Nullish Coalescing Operator
description: 借助 Babel 使用ES新语法 Nullish Coalescing Operator [提案阶段] 简化代码。
tags: JavaScript
bannerImg: /static/images/bg4.jpg
---

## 前言

在日常开发中经常有遇到判断一个变量是否存在，存在就用它不存在就用另一个。

<!--more-->

```javascript
foo ? foo : default
```

以上这种写法虽说是可以简写为 `foo || default` 但是在很多情况下我们又需要将 `0` 等假值展示出来，还要加以判断。

现在已经有一个草案 [Nullish Coalescing Operator](https://tc39.es/proposal-nullish-coalescing/) 可以很方便的解决这个问题。它内部是将 `null` 和 `undefined` 过滤掉了。

## 例子

```javascript
const a = undefined;
const baz = a ?? 'default'; // 'default'

const b = null;
const baz2 = b ?? 'default'; // 'default'

const c = 0;
const baz3 = c ?? 'default'; // 0

const d = NaN;
conost baz4 = d ?? 'default'; // NaN

```

## 用法

### 安装插件

```shell
yarn add @babel/plugin-proposal-nullish-coalescing-operator -D
```

### .babelrc

```json
{
  "plugins": ["@babel/plugin-proposal-nullish-coalescing-operator"]
}
```
