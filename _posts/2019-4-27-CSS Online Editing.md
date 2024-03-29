---
layout: post
title: CSS 在线编辑
description: 使用 Contenteditable 属性实现 CSS 在线编辑
tags: CSS
bannerImg: /static/images/bg4.jpg
---

## 前言

先了解一下 Contenteditable 属性的作用：规定元素内容是否可编辑。

## 案例

给页面加上 style 标签，设置 style 属性为 display: block，contenteditable 属性为 true。

<!--more-->

```html
<style style="display: block" contenteditable="true">
  body {
    color: red;
  }
</style>
```

## 实时编辑

效果如下，选中下方内容，可以编辑并且能影响到本页面的样式。

<style style="display: block; border: 1px solid #ddd; padding: 10px; background-color: #f5f2f0;" contenteditable="true">
  body .container {
    color: red;
  }
</style>

编辑的时候不能换行，否则就会插入一个 div 导致后面的样式失效。
