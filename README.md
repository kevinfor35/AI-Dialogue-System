# Flask React Chat Application

这是一个基于Flask和React的聊天应用程序，提供用户认证和聊天历史记录功能。

## 功能特点

- 用户注册和登录系统
- 实时聊天功能
- 聊天历史记录保存
- 响应式用户界面

## 技术栈

### 后端
- Flask
- SQLAlchemy
- Flask-Migrate
- Alembic

### 前端
- React
- Material-UI
- Axios
- React Router
- Vite

## 安装说明

1. 克隆仓库
```bash
git clone [repository-url]
cd [repository-name]
```

2. 安装后端依赖
```bash
pip install -r requirements.txt
```

3. 安装前端依赖
```bash
cd frontend
npm install
```

## 运行应用

1. 启动后端服务器
```bash
python app.py
```

2. 启动前端开发服务器
```bash
cd frontend
npm run dev
```

访问 http://localhost:3004 即可使用应用。

## 数据库迁移

初始化数据库：
```bash
flask db upgrade
```

## 项目结构

```
.
├── app.py              # Flask应用主文件
├── requirements.txt    # Python依赖文件
├── migrations/        # 数据库迁移文件
└── frontend/         # React前端应用
    ├── src/          # 源代码
    ├── package.json  # npm配置文件
    └── vite.config.js # Vite配置文件
```