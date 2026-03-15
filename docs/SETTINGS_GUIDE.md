# 模型设置使用指南

## 🎯 功能说明

通过网页界面配置 AI 模型的 API 密钥，无需修改代码或环境变量。

---

## 📱 如何使用

### 1. 访问设置页面

两种方式：

**方式 A：通过导航栏**
- 点击导航栏右侧的 ⚙️ 设置按钮

**方式 B：直接访问**
- 访问 URL: `http://localhost:3000/settings`

### 2. 配置 API 密钥

在设置页面，你可以配置：

#### 🔑 DeepSeek API Key
- **用途**：AI 对话、内容生成
- **获取方式**：访问 [DeepSeek 平台](https://platform.deepseek.com/)
- **格式**：`sk-...`

#### 🎨 即梦 API 配置

**Access Key**
- **用途**：图片生成
- **获取方式**：访问 [火山引擎控制台](https://console.volcengine.com/)
- **格式**：`AK...`

**Secret Key**
- **用途**：图片生成
- **获取方式**：访问 [火山引擎控制台](https://console.volcengine.com/)
- **格式**：`SK...`

### 3. 保存设置

1. 在对应输入框中输入密钥
2. 点击「💾 保存设置」按钮
3. 看到「设置已保存！」提示
4. **立即生效**，无需重启服务

### 4. 删除配置

如果需要删除某个密钥：
1. 在「配置状态」卡片中找到要删除的密钥
2. 点击「删除」按钮
3. 确认删除

---

## 🔒 安全说明

### 密钥存储

```
优先级：server-settings.json > 环境变量
```

| 存储位置 | 说明 | 安全性 |
|---------|------|--------|
| **server-settings.json** | 服务端文件存储 | ✅ 推荐 |
| **环境变量** | `.env.local` | ✅ 推荐 |
| **客户端** | 不存储 | ❌ 永不 |

### 安全特性

✅ **服务端存储**
- 密钥只存储在服务器端
- 客户端永远无法访问实际密钥
- 只返回配置状态（已配置/未配置）

✅ **文件保护**
- `server-settings.json` 已添加到 `.gitignore`
- 不会被提交到 Git 仓库

✅ **立即生效**
- 保存后自动更新环境变量
- 无需重启服务

---

## 💡 使用场景

### 场景 1：首次配置

```bash
# 1. 启动服务
npm run dev

# 2. 访问 http://localhost:3000/settings

# 3. 输入密钥并保存

# 4. 立即可以使用 AI 功能
```

### 场景 2：更新密钥

```bash
# 1. 访问 /settings

# 2. 在输入框中输入新密钥

# 3. 保存 → 立即生效
```

### 场景 3：Docker 部署

```yaml
# docker-compose.yml
services:
  app:
    volumes:
      - ./server-settings.json:/app/server-settings.json
```

---

## 🚀 API 端点

### 获取配置状态

```http
GET /api/settings
```

响应：
```json
{
  "success": true,
  "configured": {
    "DEEPSEEK_API_KEY": true,
    "JIMENG_ACCESS_KEY": false,
    "JIMENG_SECRET_KEY": false
  },
  "updatedAt": "2026-03-15T12:00:00.000Z"
}
```

### 保存配置

```http
POST /api/settings
Content-Type: application/json

{
  "DEEPSEEK_API_KEY": "sk-...",
  "JIMENG_ACCESS_KEY": "AK...",
  "JIMENG_SECRET_KEY": "SK..."
}
```

### 删除配置

```http
DELETE /api/settings?key=DEEPSEEK_API_KEY
```

---

## ⚠️ 注意事项

### 1. 密钥格式

确保密钥格式正确：
- DeepSeek: 以 `sk-` 开头
- 即梦 Access Key: 以 `AK` 开头
- 即梦 Secret Key: 以 `SK` 开头

### 2. 空密钥

- 留空 = 不更新该字段
- 可以只更新部分密钥

### 3. Docker 部署

使用 Docker 时，确保持久化 `server-settings.json` 文件。

### 4. 多环境

不同环境（开发/生产）建议使用不同的密钥。

---

## 📞 问题排查

### Q: 保存后仍然提示未配置？

**A:** 检查：
1. 浏览器控制台是否有错误
2. 服务器日志是否有错误
3. `server-settings.json` 文件是否存在

### Q: 密钥泄露了怎么办？

**A:**
1. 立即在对应平台重新生成密钥
2. 删除旧的 `server-settings.json`
3. 重新配置新密钥

### Q: 支持哪些浏览器？

**A:** 所有现代浏览器：
- Chrome/Edge (推荐)
- Firefox
- Safari

---

## 📚 相关文档

- [DeepSeek API 文档](https://platform.deepseek.com/docs)
- [火山引擎文档](https://www.volcengine.com/docs/visual)
- [项目 README](../README.md)

---

**最后更新**: 2026-03-15
**版本**: 1.0.0
