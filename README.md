# Jace's Home

> 这是我的个人主页，访问地址 <https://jaceyi.com>

## 本地预览

项目是纯静态站点，不需要安装依赖，直接用 Node 起一个本地服务器即可：

```bash
node dev-server.js        # 默认 http://localhost:3000
node dev-server.js 8080   # 指定端口，也可用 PORT 环境变量
```

服务器以项目根目录为站点根目录，页面里的 `/static/...` 绝对路径可以正常加载；请求目录会返回该目录下的 `index.html`（如 `/wechat`），请求不存在的路径会返回 `404.html`。
