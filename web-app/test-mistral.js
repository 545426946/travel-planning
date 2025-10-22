// Mistral AI API 连接测试脚本
const apiKey = 'E8L3fryNUIsAoWvROdNrumpwFTtfuCBL'

async function testMistralAPI() {
  console.log('🔍 开始测试Mistral AI API连接...')
  
  try {
    // 测试1: 获取可用模型列表
    console.log('📋 测试1: 获取模型列表...')
    const modelsResponse = await fetch('https://api.mistral.ai/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    })
    
    if (modelsResponse.ok) {
      const modelsData = await modelsResponse.json()
      console.log('✅ 模型列表获取成功!')
      console.log('可用模型:', modelsData.data.map(m => m.id).join(', '))
    } else {
      console.log('❌ 模型列表获取失败:', modelsResponse.status, modelsResponse.statusText)
    }
    
    // 测试2: 测试聊天功能
    console.log('\n💬 测试2: 测试聊天功能...')
    const chatResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: '请用一句话回复：测试成功！'
          }
        ],
        max_tokens: 50
      })
    })
    
    if (chatResponse.ok) {
      const chatData = await chatResponse.json()
      console.log('✅ 聊天功能测试成功!')
      console.log('AI回复:', chatData.choices[0].message.content)
    } else {
      const errorText = await chatResponse.text()
      console.log('❌ 聊天功能测试失败:', chatResponse.status, errorText)
    }
    
  } catch (error) {
    console.log('❌ 网络错误:', error.message)
  }
}

// 运行测试
testMistralAPI()