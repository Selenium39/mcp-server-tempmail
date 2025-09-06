#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosResponse } from 'axios';

const SERVER_NAME = "mcp-server-tempmail";
const SERVER_VERSION = "1.0.0";
const DEFAULT_BASE_URL = "https://chat-tempmail.com";

interface TempMailApiResponse<T> {
  data?: T;
  success?: boolean;
  error?: string;
}

interface Email {
  id: string;
  address: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

interface Message {
  id: string;
  from_address: string;
  subject: string;
  content?: string;
  html?: string;
  received_at: number;
}

interface WebhookConfig {
  url: string;
  enabled: boolean;
}

class TempMailMCPServer {
  private server: Server;
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.TEMPMAIL_API_KEY || '';
    if (!this.apiKey) {
      throw new Error('TEMPMAIL_API_KEY环境变量未设置');
    }
    
    this.baseUrl = process.env.TEMPMAIL_BASE_URL || DEFAULT_BASE_URL;
    
    console.error(`[DEBUG] API Key loaded: ${this.apiKey.substring(0, 8)}...`);
    console.error(`[DEBUG] Base URL: ${this.baseUrl}`);

    this.server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupErrorHandling() {
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          // 邮箱管理工具
          {
            name: "get_email_domains",
            description: "获取系统中所有可用的邮箱域名",
            inputSchema: {
              type: "object",
              properties: {},
              required: []
            }
          } as Tool,
          {
            name: "create_email",
            description: "创建新的临时邮箱地址",
            inputSchema: {
              type: "object",
              properties: {
                name: {
                  type: "string",
                  description: "邮箱前缀名称"
                },
                domain: {
                  type: "string",
                  description: "邮箱域名"
                },
                expiryTime: {
                  type: "number",
                  description: "过期时间（毫秒）。可选值：3600000（1小时），86400000（1天），259200000（3天），0（永久）",
                  enum: [3600000, 86400000, 259200000, 0]
                }
              },
              required: ["name", "domain", "expiryTime"]
            }
          } as Tool,
          {
            name: "list_emails",
            description: "获取账户下的所有邮箱地址",
            inputSchema: {
              type: "object",
              properties: {
                cursor: {
                  type: "string",
                  description: "分页游标，可选"
                }
              },
              required: []
            }
          } as Tool,
          {
            name: "delete_email",
            description: "删除指定的邮箱地址",
            inputSchema: {
              type: "object",
              properties: {
                emailId: {
                  type: "string",
                  description: "邮箱ID"
                }
              },
              required: ["emailId"]
            }
          } as Tool,
          // 消息管理工具
          {
            name: "get_messages",
            description: "获取指定邮箱中的所有消息",
            inputSchema: {
              type: "object",
              properties: {
                emailId: {
                  type: "string",
                  description: "邮箱ID"
                },
                cursor: {
                  type: "string",
                  description: "分页游标，可选"
                }
              },
              required: ["emailId"]
            }
          } as Tool,
          {
            name: "get_message_detail",
            description: "获取指定消息的详细内容",
            inputSchema: {
              type: "object",
              properties: {
                emailId: {
                  type: "string",
                  description: "邮箱ID"
                },
                messageId: {
                  type: "string",
                  description: "消息ID"
                }
              },
              required: ["emailId", "messageId"]
            }
          } as Tool,
          {
            name: "delete_message",
            description: "删除指定的消息",
            inputSchema: {
              type: "object",
              properties: {
                emailId: {
                  type: "string",
                  description: "邮箱ID"
                },
                messageId: {
                  type: "string",
                  description: "消息ID"
                }
              },
              required: ["emailId", "messageId"]
            }
          } as Tool,
          // Webhook配置工具
          {
            name: "get_webhook_config",
            description: "获取当前的webhook配置信息",
            inputSchema: {
              type: "object",
              properties: {},
              required: []
            }
          } as Tool,
          {
            name: "set_webhook_config",
            description: "设置或更新webhook配置",
            inputSchema: {
              type: "object",
              properties: {
                url: {
                  type: "string",
                  description: "Webhook URL地址（必须是有效的HTTP/HTTPS URL）"
                },
                enabled: {
                  type: "boolean",
                  description: "是否启用webhook"
                }
              },
              required: ["url", "enabled"]
            }
          } as Tool
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        if (!args) {
          throw new Error('缺少必需的参数');
        }

        const typedArgs = args as Record<string, any>;

        switch (name) {
          case "get_email_domains":
            return await this.getEmailDomains();
          
          case "create_email":
            return await this.createEmail(typedArgs.name, typedArgs.domain, typedArgs.expiryTime);
          
          case "list_emails":
            return await this.listEmails(typedArgs.cursor);
          
          case "delete_email":
            return await this.deleteEmail(typedArgs.emailId);
          
          case "get_messages":
            return await this.getMessages(typedArgs.emailId, typedArgs.cursor);
          
          case "get_message_detail":
            return await this.getMessageDetail(typedArgs.emailId, typedArgs.messageId);
          
          case "delete_message":
            return await this.deleteMessage(typedArgs.emailId, typedArgs.messageId);
          
          case "get_webhook_config":
            return await this.getWebhookConfig();
          
          case "set_webhook_config":
            return await this.setWebhookConfig(typedArgs.url, typedArgs.enabled);
          
          default:
            throw new Error(`未知的工具: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `错误: ${error instanceof Error ? error.message : String(error)}`
            }
          ],
          isError: true
        };
      }
    });
  }

  private getAuthHeaders() {
    return {
      'X-API-Key': this.apiKey,
      'Content-Type': 'application/json'
    };
  }

  private async makeRequest<T>(
    method: 'GET' | 'POST' | 'DELETE',
    endpoint: string,
    data?: any
  ): Promise<T> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const headers = this.getAuthHeaders();
      console.error(`[DEBUG] Making request to: ${url}`);
      console.error(`[DEBUG] Headers:`, headers);
      
      const response: AxiosResponse<T> = await axios({
        method,
        url,
        headers,
        data
      });
      
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error(`[DEBUG] Error response:`, error.response?.data);
        throw new Error(`API请求失败: ${error.response?.status} ${error.response?.statusText} - ${JSON.stringify(error.response?.data)}`);
      }
      throw error;
    }
  }

  // 邮箱管理方法
  private async getEmailDomains() {
    const response = await this.makeRequest<{ domains: string[] }>('GET', '/api/email/domains');
    
    return {
      content: [
        {
          type: "text",
          text: `可用域名:\n${response.domains.map(domain => `- ${domain}`).join('\n')}`
        }
      ]
    };
  }

  private async createEmail(name: string, domain: string, expiryTime: number) {
    const response = await this.makeRequest<{ id: string; email: string }>('POST', '/api/emails/generate', {
      name,
      domain,
      expiryTime
    });
    
    const expiryText = expiryTime === 0 ? '永久' : 
                     expiryTime === 3600000 ? '1小时' :
                     expiryTime === 86400000 ? '1天' :
                     expiryTime === 259200000 ? '3天' : `${expiryTime}毫秒`;
    
    return {
      content: [
        {
          type: "text",
          text: `成功创建临时邮箱:\n邮箱地址: ${response.email}\n邮箱ID: ${response.id}\n有效期: ${expiryText}`
        }
      ]
    };
  }

  private async listEmails(cursor?: string) {
    const endpoint = cursor ? `/api/emails?cursor=${cursor}` : '/api/emails';
    const response = await this.makeRequest<{
      emails: Email[];
      nextCursor: string;
      total: number;
    }>('GET', endpoint);
    
    const emailList = response.emails.map(email => 
      `- ${email.address} (ID: ${email.id})\n  创建时间: ${new Date(email.createdAt).toLocaleString('zh-CN')}\n  过期时间: ${new Date(email.expiresAt).toLocaleString('zh-CN')}`
    ).join('\n\n');
    
    return {
      content: [
        {
          type: "text",
          text: `邮箱列表 (共 ${response.total} 个):\n\n${emailList}${response.nextCursor ? `\n\n下页游标: ${response.nextCursor}` : ''}`
        }
      ]
    };
  }

  private async deleteEmail(emailId: string) {
    const response = await this.makeRequest<{ success: boolean }>('DELETE', `/api/emails/${emailId}`);
    
    return {
      content: [
        {
          type: "text",
          text: response.success ? `成功删除邮箱 ${emailId}` : `删除邮箱失败`
        }
      ]
    };
  }

  // 消息管理方法
  private async getMessages(emailId: string, cursor?: string) {
    const endpoint = cursor ? `/api/emails/${emailId}?cursor=${cursor}` : `/api/emails/${emailId}`;
    const response = await this.makeRequest<{
      messages: Message[];
      nextCursor: string;
      total: number;
    }>('GET', endpoint);
    
    if (response.messages.length === 0) {
      return {
        content: [
          {
            type: "text",
            text: "该邮箱暂无消息"
          }
        ]
      };
    }
    
    const messageList = response.messages.map(msg => 
      `- 消息ID: ${msg.id}\n  发件人: ${msg.from_address}\n  主题: ${msg.subject}\n  接收时间: ${new Date(msg.received_at).toLocaleString('zh-CN')}`
    ).join('\n\n');
    
    return {
      content: [
        {
          type: "text",
          text: `邮箱消息列表 (共 ${response.total} 条):\n\n${messageList}${response.nextCursor ? `\n\n下页游标: ${response.nextCursor}` : ''}`
        }
      ]
    };
  }

  private async getMessageDetail(emailId: string, messageId: string) {
    const response = await this.makeRequest<{ message: Message }>('GET', `/api/emails/${emailId}/${messageId}`);
    const msg = response.message;
    
    return {
      content: [
        {
          type: "text",
          text: `消息详情:\n\n消息ID: ${msg.id}\n发件人: ${msg.from_address}\n主题: ${msg.subject}\n接收时间: ${new Date(msg.received_at).toLocaleString('zh-CN')}\n\n纯文本内容:\n${msg.content || '(无内容)'}\n\nHTML内容:\n${msg.html || '(无HTML内容)'}`
        }
      ]
    };
  }

  private async deleteMessage(emailId: string, messageId: string) {
    const response = await this.makeRequest<{ success: boolean }>('DELETE', `/api/emails/${emailId}/${messageId}`);
    
    return {
      content: [
        {
          type: "text",
          text: response.success ? `成功删除消息 ${messageId}` : `删除消息失败`
        }
      ]
    };
  }

  // Webhook配置方法
  private async getWebhookConfig() {
    const response = await this.makeRequest<WebhookConfig>('GET', '/api/webhook');
    
    return {
      content: [
        {
          type: "text",
          text: `Webhook配置:\nURL: ${response.url || '(未设置)'}\n状态: ${response.enabled ? '已启用' : '已禁用'}`
        }
      ]
    };
  }

  private async setWebhookConfig(url: string, enabled: boolean) {
    const response = await this.makeRequest<{ success: boolean }>('POST', '/api/webhook', {
      url,
      enabled
    });
    
    return {
      content: [
        {
          type: "text",
          text: response.success ? 
            `成功设置Webhook配置:\nURL: ${url}\n状态: ${enabled ? '已启用' : '已禁用'}` :
            'Webhook配置设置失败'
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`${SERVER_NAME} v${SERVER_VERSION} 运行中...`);
  }
}

const server = new TempMailMCPServer();
server.run().catch(console.error);
