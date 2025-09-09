# MCP Server - 临时邮箱

基于 [ChatTempMail](https://chat-tempmail.com/zh) API 的 MCP (Model Context Protocol) 服务器，提供临时邮箱管理功能。

## 功能特性

### 邮箱管理
- ✅ 获取可用域名
- ✅ 创建临时邮箱
- ✅ 查看邮箱列表
- ✅ 删除邮箱

### 消息管理  
- ✅ 获取邮箱消息列表
- ✅ 查看消息详细内容
- ✅ 删除消息

### Webhook配置
- ✅ 获取Webhook配置
- ✅ 设置Webhook配置

## 安装和使用

### 1. 获取API密钥

1. 访问 [chat-tempmail.com/zh](https://chat-tempmail.com/zh)
2. 注册账户并登录
3. 在个人资料页面创建API密钥

### 2. 在MCP客户端中配置

在支持MCP的应用（如Claude Desktop、Cursor等）的配置文件中添加配置，**务必将API密钥设置在环境变量中**：

**从源码安装：**
```json
{
  "mcpServers": {
    "tempmail": {
      "command": "npx",
      "args": [
        "--from",
        "git+https://github.com/Selenium39/mcp-server-tempmail.git",
        "mcp-server-tempmail"
      ],
      "env": {
        "TEMPMAIL_API_KEY": "your-api-key-here",
        "TEMPMAIL_BASE_URL": "https://chat-tempmail.com"
      }
    }
  }
}
```

**从包管理器安装：**
```json
{
  "mcpServers": {
    "tempmail": {
      "command": "npx",
      "args": ["mcp-server-tempmail"],
      "env": {
        "TEMPMAIL_API_KEY": "your-api-key-here",
        "TEMPMAIL_BASE_URL": "https://chat-tempmail.com"
      }
    }
  }
}
```

⚠️ **重要：** 
- 请将 `your-api-key-here` 替换为您在chat-tempmail.com获取的真实API密钥
- `TEMPMAIL_BASE_URL` 是可选的，如果不指定则默认为 `https://chat-tempmail.com`

### 3. 重启应用

配置完成后重启对应的MCP客户端应用即可使用。

## MCP工具说明

### 邮箱管理工具

#### `get_email_domains`
获取系统中所有可用的邮箱域名。

**参数:** 无需参数

#### `create_email`  
创建新的临时邮箱地址。

**参数:**
- `name` (必需): 邮箱前缀名称
- `domain` (必需): 邮箱域名
- `expiryTime` (必需): 过期时间，可选值：
  - `3600000` - 1小时
  - `86400000` - 1天  
  - `259200000` - 3天
  - `0` - 永久

#### `list_emails`
获取账户下的所有邮箱地址。

**参数:**
- `cursor` (可选): 分页游标

#### `delete_email`
删除指定的邮箱地址。

**参数:**
- `emailId` (必需): 邮箱ID

### 消息管理工具

#### `get_messages`
获取指定邮箱中的所有消息。

**参数:**
- `emailId` (必需): 邮箱ID
- `cursor` (可选): 分页游标

#### `get_message_detail`
获取指定消息的详细内容。

**参数:**
- `emailId` (必需): 邮箱ID
- `messageId` (必需): 消息ID

#### `delete_message`
删除指定的消息。

**参数:**
- `emailId` (必需): 邮箱ID
- `messageId` (必需): 消息ID

### Webhook配置工具

#### `get_webhook_config`
获取当前的webhook配置信息。

**参数:** 无需参数

#### `set_webhook_config`
设置或更新webhook配置。

**参数:**
- `url` (必需): Webhook URL地址
- `enabled` (必需): 是否启用webhook

## 使用示例

### 获取可用域名

```
请获取所有可用的邮箱域名。
```

### 创建临时邮箱

```
请创建一个名为 "test" 的邮箱，使用域名 "chat-tempmail.com"，有效期1小时。
```

### 查看邮箱消息

```
请查看邮箱ID "c2c4f894-c672-4d5b-a918-abca95aff1f7" 中的所有消息。
```

### 查看消息详情

```  
请查看邮箱ID "c2c4f894-c672-4d5b-a918-abca95aff1f7" 中消息ID "fd13a8df-1465-4fbc-a612-ca7311c31ff2" 的详细内容。
```

## 注意事项

- API密钥通过环境变量`TEMPMAIL_API_KEY`配置，请妥善保管，不要在公共场所泄露
- 基础URL可以通过环境变量`TEMPMAIL_BASE_URL`自定义（默认为`https://chat-tempmail.com`）
- 临时邮箱会根据设置的过期时间自动失效
- 分页查询时可以使用 `nextCursor` 获取更多数据
- 确保在MCP客户端配置文件中正确设置了环境变量

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request。
