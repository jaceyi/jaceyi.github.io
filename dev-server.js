/**
 * 本机预览用的静态服务器，零依赖：node dev-server.js [端口]
 * 站点根目录就是本项目根目录，请求目录时返回该目录下的 index.html。
 */

'use strict';

const fs = require('fs');
const http = require('http');
const path = require('path');

const ROOT = __dirname;
const PORT = process.argv[2] || process.env.PORT || 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

// 文本类响应统一补上 charset，省得每条都写一遍
const TEXT_MIME = /^(text\/|image\/svg|application\/json)/;

function contentType(filePath) {
  const type = MIME_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  return TEXT_MIME.test(type) ? `${type}; charset=utf-8` : type;
}

http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    } catch {
      pathname = req.url;
    }

    // path.normalize 会折叠掉 ../，拼出来的路径不会跑到项目目录之外
    let filePath = path.join(ROOT, path.normalize(pathname));
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(path.join(ROOT, '404.html')));
    }

    res.writeHead(200, { 'Content-Type': contentType(filePath) });
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => res.destroy()); // 文件读不到时别让整个进程崩掉
    stream.pipe(res);
  })
  .listen(PORT, () => console.log(`http://localhost:${PORT}`));
