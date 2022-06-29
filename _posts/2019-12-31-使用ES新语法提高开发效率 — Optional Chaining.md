---
layout: post
title: 使用ES新语法提高开发效率 — Optional Chaining
description: 借助 Babel 使用ES新语法 Optional Chaining [提案阶段] 简化代码。
tags: JavaScript
bannerImg: /static/images/bg-banner.jpeg
---

## 前言

在现在 Object 属性链的调用中，很容易因使用不当导致某个属性不存在而抛出 `Cannot read property 'xxx' of undefined` 的错误。

<!--more-->

现在已经有一个草案 [Optional Chaining](https://tc39.es/proposal-optional-chaining/) 可以很方便的解决这个问题。

## 例子

### 访问深层次嵌套的属性

```javascript
const obj = {
  foo: {
    bar: {
      baz: 42,
    },
  },
};

const baz = obj?.foo?.bar?.baz; // 42

const safe = obj?.qux?.baz; // undefined
```

### 调用层次嵌套的函数

```javascript
const obj = {
  foo: {
    bar: {
      baz() {
        return 42;
      },
    },
  },
};

const baz = obj?.foo?.bar?.baz(); // 42

const safe = obj?.qux?.baz(); // undefined
const safe2 = obj?.foo.bar.qux?.(); // undefined
const safe3 = obj?.xxx?.yyy?.[0]; // undefined

const willThrow = obj?.foo.bar.qux(); // Error: not a function
```

### 顶层函数

```javascript
function test() {
  return 42;
}

test?.(); // 42
exists?.(); // undefined
```

> 类的写法同方法一样。

## 用法

### 安装插件

```shell
yarn add @babel/plugin-proposal-optional-chaining -D
```

### .babelrc

```json
{
  "plugins": ["@babel/plugin-proposal-optional-chaining"]
}
```
