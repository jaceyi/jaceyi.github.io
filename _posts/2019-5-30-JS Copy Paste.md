---
layout: post
title: JS 实现复制与粘贴
description: 如何使用 JS 获取剪贴板的内容与添加内容到剪贴板
tags: JavaScript
bannerImg: /static/images/bg4.jpg
---

## 复制

### 拦截复制

应用场景：拦截用户复制事件，或者改变用户复制的内容。

<!--more-->

```javascript
// 监听复制事件
document.addEventListener("copy", (e) => {
  // selection 是当前选中的内容
  const selection = window.getSelection();
  // 给选中的内容添加多余的内容
  e.clipboardData.setData("text", `${selection} Jace Blog`);
  // 阻止默认的复制事件
  e.preventDefault();
});
```

### 自动复制

应用场景：快捷复制内容到用户剪贴板。

```javascript
const sel = window.getSelection();
// 选择元素的内容
sel.selectAllChildren(document.body);
// 执行复制
document.execCommand("Copy");
// 取消选择
sel.removeAllRanges();
```

## 粘贴

### 粘贴文字

应用场景：拦截用户粘贴事件，快速获取粘贴内容。

```javascript
// 监听粘贴事件
document.addEventListener("paste", (e) => {
  // 获取用户粘贴的内容
  const paste = e.clipboardData.getData("text");
  console.log(paste.trim());
});
```

### 粘贴文件

应用场景：实现粘贴上传文件。

```javascript
document.addEventListener("paste", (e) => {
  const { items } = e.clipboardData;
  for (let i = 0; i < items.length; i++) {
    if (item.kind === "file") {
      let file = item.getAsFile(); // 获取文件
    }
  }
});
```

`items` 中都是 [DataTransferItem](https://developer.mozilla.org/en-US/docs/Web/API/DataTransferItem) 类型的数据。

备注：剪贴板的 API 还属于草案阶段 [Clipboard event paste](https://w3c.github.io/clipboard-apis/#clipboard-event-paste) 。
