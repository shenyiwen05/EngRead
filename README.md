项目已上线
https://engread.pages.dev/
需要注册请联系Q：649973667






<img width="1279" height="703" alt="image" src="https://github.com/user-attachments/assets/75d7d4bb-e8ae-4c4f-ac25-d3abe5ee3fb9" />
<img width="2552" height="1402" alt="image" src="https://github.com/user-attachments/assets/34e5fbdb-dccd-4b4e-ba55-885a765c1012" />
<img width="1275" height="689" alt="image" src="https://github.com/user-attachments/assets/cb07e642-d2b7-4f4d-a012-d49184221289" />
<img width="2554" height="1375" alt="image" src="https://github.com/user-attachments/assets/802157e0-7fe9-4c6c-abd7-3ab8dc1a70cc" />

## 项目简介

EngRead 是一个面向英语阅读学习的 Web 应用。用户可以导入英文文章，系统会生成分句翻译、重点词、词组、熟词生义、长句拆解和复盘内容，帮助用户在原文语境中理解文章。

当前已支持：

- 用户注册、登录和邀请码注册。
- 系统示例文章和用户导入文章。
- AI 文章分析、翻译、词组解释、熟词生义解释、长句拆解。
- 阅读页英文优先展示，点击句子查看翻译，点击词/词组查看解释。
- 收藏词组、熟词生义和长句。
- 复盘页和收藏页。
- 考研阅读训练题生成：可基于文章生成考研风格选择题、答案解析、干扰项分析，并高亮原文证据句。

## 本地开发

后端：

```powershell
cd D:\EngRead\context-reader\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

前端：

```powershell
cd D:\EngRead\context-reader\frontend
npm run dev -- --host=127.0.0.1 --port=5173
```

本地访问：

```text
http://127.0.0.1:5173
```

如果前端需要连接本地后端，可以在 `frontend/.env.local` 中设置：

```env
VITE_API_BASE_URL=http://127.0.0.1:8001
```

## 测试与构建

后端测试：

```powershell
cd D:\EngRead\context-reader\backend
.\.venv\Scripts\python.exe -m pytest tests -q
```

前端测试和构建：

```powershell
cd D:\EngRead\context-reader\frontend
npm run test
npm run build
```

## 部署

前端部署在 Cloudflare Pages：

```text
https://engread.pages.dev
```

后端部署在 Render：

```text
https://engread.onrender.com
```

后端启动命令会自动执行数据库迁移：

```bash
python -m alembic -c alembic.ini upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

推送到 GitHub `main` 分支后，Render 和 Cloudflare Pages 会自动部署。

## 注意事项

- 不要提交 `backend/.env`、数据库连接串、JWT 密钥或 AI API Key。
- Render 免费实例可能会休眠，首次访问后端可能需要等待几十秒。
- 长文章分析可能耗时较久；如果 AI 输出过长或超时，建议先用较短文章测试。
- 考研训练题依赖文章已经成功完成 AI 分析，并且后端 AI 环境变量已配置。
