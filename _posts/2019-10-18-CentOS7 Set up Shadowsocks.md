---
layout: post
title: CentOS7 搭建 Shadowsocks 科学上网
description: 使用 CenOS7 搭建 Shadowsocks 并配置多用户多端口访问
tags: CentOS Shadowsocks
bannerImg: /static/images/bg4.jpg
---

## 前言

想要搭梯子肯定是需要一台国外的服务器，这里推荐买香港的服务器，延迟低一些。

<!--more-->

## 安装

### 下载安装文件

```shell
wget --no-check-certificate -O shadowsocks-libev.sh https://raw.githubusercontent.com/teddysun/shadowsocks_install/master/shadowsocks-libev.sh
```

### 给予文件执行权限

```shell
chmod +x shadowsocks-libev.sh
```

### 执行文件

```shell
./shadowsocks-libev.sh 2>&1 | tee shadowsocks-libev.log
```

执行完上一步命令后会提示让输入密码、端口号以及加密方式，这里推荐选择 [aes-256-cfb] 加密方式，接下来按任意键开始安装安装。安装完成后会显示你之前设置的配置参数。

## 安装完成

使用 `service shadowsocks status` 命令查看 Shadowsocks 运行状态。这里记住要将服务器防火墙的对应端口打开。

```shell
service shadowsocks status

Shadowsocks-libev (pid 14577) is running...
```

**相关命令**

- `service shadowsocks start` 启动服务
- `service shadowsocks stop` 停止服务
- `service shadowsocks restart` 重启服务
- `service shadowsocks status` 查看服务状态

### 配置文件

查看编辑配置文件。

```shell
# /etc/shadowsocks-libev/config.json
{
    "server": "0.0.0.0", # 主机IP
    "server_port": 5000, # Shadowsocks 服务在服务器端监听的端口
    "local_port": 1080, # 客户端的端口
    "password": "XXXXXX", # 密码
    "timeout": 60, # 连接超时时（单位：秒）
    "method": "aes-256-cfb" # 加密方式
}
```

## 客户端

- [Windows 版本](https://github.com/shadowsocks/shadowsocks-windows/releases)
- [Mac 版本](https://github.com/shadowsocks/shadowsocks-iOS/releases)

下载客户端设置对应配置即可。走到这里已经实现了科学上网，能访问 Google 了。

## 多用户配置

复制配置文件，并编辑新的配置文件，设置端口密码等。一个用户一个配置文件。

```shell
cp /etc/shadowsocks-libev/config.json /etc/shadowsocks-libev/user2.json

vim /etc/shadowsocks-libev/user2.json
```

根据新的配置启动 ss-server 服务， 服务启动后就可在客户客户端进行访问了。

```shell
setsid ss-server -c /etc/shadowsocks-libev/user2.json -u
```

使用 `ps ax | grep ss-server` 查看服务进程的 PID

```shell
ps ax | grep ss-server

24145 ? Ss 0:00 /usr/local/bin/ss-server -v -c /etc/shadowsocks-libev/config.json -f /var/run/shadowsocks-libev.pid
25575 ? Ss 0:00 ss-server -c /etc/shadowsocks-libev/user2.json
25591 pts/0 R+ 0:00 grep --color=auto ss-server
```

使用 `netstat -lnp` 查看监听的端口，使用 `kill [PID]` 终止 `ss-server` 启动的服务进程。
