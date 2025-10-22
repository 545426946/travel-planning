// Mistral AI API连接测试工具
import { message } from 'ant-design-vue'

export class MistralAPITester {
  static async testConnection(apiKey) {
    try {
      const response = await fetch('https://api.mistral.ai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: 'Mistral AI API连接成功！',
          models: data.data.map(model => model.id)
        }
      } else {
        return {
          success: false,
          message: `API连接失败: ${response.status} ${response.statusText}`
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `网络错误: ${error.message}`
      }
    }
  }

  static async testChatCompletion(apiKey, model = 'mistral-small-latest') {
    try {
      const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'user',
              content: '请用一句话回复：测试成功！'
            }
          ],
          max_tokens: 50
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        return {
          success: true,
          message: '聊天功能测试成功！',
          response: data.choices[0].message.content
        }
      } else {
        const errorText = await response.text()
        return {
          success: false,
          message: `聊天测试失败: ${response.status}`,
          error: errorText
        }
      }
    } catch (error) {
      return {
        success: false,
        message: `网络错误: ${error.message}`
      }
    }
  }

  // 完整的API测试流程
  static async fullTest(apiKey) {
    message.loading({ content: '正在测试Mistral AI API连接...', key: 'api-test', duration: 0 })
    
    const connectionTest = await this.testConnection(apiKey)
    
    if (!connectionTest.success) {
      message.error({ content: connectionTest.message, key: 'api-test' })
      return connectionTest
    }
    
    message.loading({ content: '连接成功，测试聊天功能...', key: 'api-test', duration: 0 })
    
    const chatTest = await this.testChatCompletion(apiKey)
    
    if (chatTest.success) {
      message.success({ 
        content: `API测试完成！可用模型: ${connectionTest.models.join(', ')}`, 
        key: 'api-test',
        duration: 5
      })
    } else {
      message.error({ content: chatTest.message, key: 'api-test' })
    }
    
    return {
      connection: connectionTest,
      chat: chatTest
    }
  }
}

// 导出测试函数
export const testMistralAPI = MistralAPITester.fullTest