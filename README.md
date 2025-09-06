# MCP Server - Temporary Email

An MCP (Model Context Protocol) server for temporary email management using the ChatTempMail API.

[中文文档](./README-zh.md)

## Features

### Email Management
- ✅ Get available domains
- ✅ Create temporary emails
- ✅ List emails
- ✅ Delete emails

### Message Management  
- ✅ Get email messages
- ✅ View message details
- ✅ Delete messages

### Webhook Configuration
- ✅ Get webhook configuration
- ✅ Set webhook configuration

## Installation and Usage

### 1. Get API Key

1. Visit [chat-tempmail.com](https://chat-tempmail.com)
2. Register an account and login
3. Create an API key in your profile page

### 2. Configure MCP Client

Add the configuration to your MCP client (Claude Desktop, Cursor, etc.), **make sure to set the API key in environment variables**:

**Install from source:**
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

**Install from package manager:**
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

⚠️ **Important:** 
- Replace `your-api-key-here` with your actual API key from chat-tempmail.com
- `TEMPMAIL_BASE_URL` is optional and defaults to `https://chat-tempmail.com` if not specified

### 3. Restart Application

Restart your MCP client application after configuration.

## MCP Tools Documentation

### Email Management Tools

#### `get_email_domains`
Get all available email domains in the system.

**Parameters:** None

#### `create_email`  
Create a new temporary email address.

**Parameters:**
- `name` (required): Email prefix name
- `domain` (required): Email domain
- `expiryTime` (required): Expiry time in milliseconds, options:
  - `3600000` - 1 hour
  - `86400000` - 1 day  
  - `259200000` - 3 days
  - `0` - permanent

#### `list_emails`
Get all email addresses under your account.

**Parameters:**
- `cursor` (optional): Pagination cursor

#### `delete_email`
Delete the specified email address.

**Parameters:**
- `emailId` (required): Email ID

### Message Management Tools

#### `get_messages`
Get all messages in the specified email address.

**Parameters:**
- `emailId` (required): Email ID
- `cursor` (optional): Pagination cursor

#### `get_message_detail`
Get detailed content of the specified message.

**Parameters:**
- `emailId` (required): Email ID
- `messageId` (required): Message ID

#### `delete_message`
Delete the specified message.

**Parameters:**
- `emailId` (required): Email ID
- `messageId` (required): Message ID

### Webhook Configuration Tools

#### `get_webhook_config`
Get current webhook configuration information.

**Parameters:** None

#### `set_webhook_config`
Set or update webhook configuration.

**Parameters:**
- `url` (required): Webhook URL address
- `enabled` (required): Whether to enable webhook

## Usage Examples

### Get Available Domains

```
Please get all available email domains.
```

### Create Temporary Email

```
Please create an email named "test" using domain "chat-tempmail.com" with 1 hour validity.
```

### View Email Messages

```
Please view all messages in email ID "c2c4f894-c672-4d5b-a918-abca95aff1f7".
```

### View Message Details

```  
Please view the detailed content of message ID "fd13a8df-1465-4fbc-a612-ca7311c31ff2" in email ID "c2c4f894-c672-4d5b-a918-abca95aff1f7".
```

## Notes

- API key is configured through the `TEMPMAIL_API_KEY` environment variable, please keep it secure and do not expose it publicly
- Base URL can be customized through the `TEMPMAIL_BASE_URL` environment variable (defaults to `https://chat-tempmail.com`)
- Temporary emails will automatically expire according to the set expiry time
- Use `nextCursor` for paginated queries to get more data
- Make sure to set the environment variables correctly in your MCP client configuration

## License

MIT

## Contributing

Issues and Pull Requests are welcome.