---
layout: post
title: 使用 Jekyll 搭建一个自己的博客
description: 如何利用 Github Pages 加 Jekyll 搭建一个自己的博客
tags: 瞎研究
bannerImg: /static/images/bg4.jpg
---

## 前言

使用 **Github Pages** 可以让在 **Github** 托管的 HTML 代码以静态页面的形式展示。

[Jekyll](https://jekyllrb.com/) 是 Github 官方推荐的工具，可以将 Markdown、Liquid、HTML 和 CSS 打包部署成为一个静态网页。

<!--more-->

## 安装 Jekyll

## macOS

### 安装命令行工具

首先安装命令行工具，用于编译本机扩展。`xcode-select --install`
这个如果总是安装失败这里可以到 [Developer Apple](https://developer.apple.com/download/more/) 主动下载一个 **Command Line Tools for Xcode** 安装。

### 安装 Ruby

#### 使用 Homebrew

```shell
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

brew install ruby
```

将 brew ruby​​ 路径添加到 shell 配置：

```shell
export PATH=/usr/local/opt/ruby/bin:$PATH
```

重新启动终端并检查更新的 Ruby 设置：

```shell
which ruby
# /usr/local/opt/ruby/bin/ruby
```

### 安装 Jekyll

```shell
sudo gem install bundler
sudo gem install jekyll
```

安装完成，以上内容参考 [Jekyll on macOS](https://jekyllrb.com/docs/installation/macos/)

## Windows

我这里给 Windows 装了一个 **Ubuntu** 的子系统，所以就直接在 Ubuntu 上安装了。参考 [Jekyll on Ubuntu](https://jekyllrb.com/docs/installation/ubuntu/) 三步搞定

## 搭建博客

这里重点讲我这个项目的结构。

- `_includes` 文件夹内的东西可以理解为公共组件，哪个页面需要就在哪个页面引入对应组件。
- `_layouts` 文件夹内包含的是模板文件，可以依据不同的场景来拆分模板文件。
- `_plugins` 文件夹包含的是博客依赖的插件，我这里使用了 `simple-jekyll-search` 做了一个站内博客的搜索功能。
- `_posts` 文件夹内包含的就是每篇博客，根据时间来命名会自动拆解。
- `_sass` 文件夹内包含的是 SASS 文件，我项目中的 style 是使用 sass 来编写的。
- `_site` 文件夹内是打包后的文件，可以忽略。
- `index.html` 是博客的入口文件。

### 代码语法高亮

作为一个技术类型的博客，代码片段肯定是必不能少的，我在博客中使用的是 [PrismJS](https://prismjs.com) ，在 [这里](https://prismjs.com/download.html) 自定义主题与需要的代码高亮，我的博客里面引用了 `markup+css+clike+javascript+bash+typescript+scss+jsx+tsx` 这些规则，如果需要变更则可以下载对应的规则替换我的 `js` 和 `css` 文件即可。

## 致谢

参考 [qiubaiying](https://github.com/qiubaiying/qiubaiying.github.io)、[Huxpro](https://github.com/Huxpro/huxpro.github.io)
