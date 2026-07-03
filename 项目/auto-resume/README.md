# Auto Resume Bot

自动化简历投递助手 — 浏览器扩展 + 本地服务架构，覆盖 Boss直聘、前程无忧、猎聘、智联招聘。

## 安装与使用

### 1. 启动本地服务

```bash
cd server
npm install
npm run dev
```

服务启动后监听 `http://localhost:9527`。

### 2. 安装浏览器扩展

1. 打开 Chrome/Edge，地址栏输入 `chrome://extensions/`
2. 开启右上角「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension/dist/` 目录

### 3. 开始使用

1. 点击浏览器工具栏的 Auto Resume 图标
2. 填写简历信息（或上传 PDF/Word 自动解析）
3. 设置目标职位条件
4. 在对应招聘网站登录账号
5. 在仪表盘点击「开始」启动自动投递

### 注意事项

- 仅工作日 9:00-18:00 投递（可配置）
- 每平台每天上限 50 份（可配置）
- 遇到验证码会暂停，需手动处理
- 使用风险自行承担

## 开发

```bash
# 启动本地服务
cd server && npm run dev

# 开发扩展（HMR）
cd extension && npm run dev

# 运行测试
cd server && npm test
```

## 技术栈

- 扩展：TypeScript + React + Vite + CRXJS + Tailwind CSS
- 服务端：Node.js + Express + WebSocket + better-sqlite3
- 简历解析：pdf-parse + mammoth
