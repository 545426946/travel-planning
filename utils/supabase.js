// utils/supabase.js
// 微信小程序环境下使用HTTP API调用Supabase

const supabaseUrl = 'https://hmnjuntvubqvbpeyqoxw.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtbmp1bnR2dWJxdmJwZXlxb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjEwNDYsImV4cCI6MjA3ODk5NzA0Nn0.BCp0_8M3OhlIhLQ4fz54le-sWqZeUx9JDRXr1XRsX8g'

// 创建查询构建器类
class QueryBuilder {
  constructor(table, supabaseUrl, supabaseAnonKey) {
    this.table = table
    this.supabaseUrl = supabaseUrl
    this.supabaseAnonKey = supabaseAnonKey
    this.queryParams = []
    this.selectColumns = '*'
    this.method = 'GET'
    this.body = null
  }

  select(columns = '*') {
    this.selectColumns = columns
    return this
  }

  eq(column, value) {
    this.queryParams.push(`${column}=eq.${value}`)
    return this
  }

  order(column, options = {}) {
    const direction = options.ascending ? 'asc' : 'desc'
    this.queryParams.push(`order=${column}.${direction}`)
    return this
  }

  limit(count) {
    this.queryParams.push(`limit=${count}`)
    return this
  }

  or(conditions) {
    this.queryParams.push(`or=(${conditions})`)
    return this
  }

  single() {
    this.queryParams.push('limit=1')
    return this
  }

  insert(data) {
    this.method = 'POST'
    this.body = data
    return this
  }

  update(data) {
    this.method = 'PATCH'
    this.body = data
    return this
  }

  upsert(data) {
    this.method = 'POST'
    this.body = data
    return this
  }

  delete() {
    this.method = 'DELETE'
    return this
  }

  buildUrl() {
    let url = `${this.supabaseUrl}/rest/v1/${this.table}`
    if (this.method === 'GET' && this.queryParams.length > 0) {
      url += '?' + this.queryParams.join('&')
    } else if (this.method !== 'GET' && this.queryParams.length > 0) {
      url += '?' + this.queryParams.filter(param => !param.startsWith('order=') && !param.startsWith('limit=')).join('&')
    }
    return url
  }

  then(callback) {
    const url = this.buildUrl()
    const headers = {
      'apikey': this.supabaseAnonKey,
      'Authorization': `Bearer ${this.supabaseAnonKey}`,
      'Content-Type': 'application/json'
    }

    // 添加特殊头部
    if (this.method === 'POST') {
      headers['Prefer'] = 'return=representation'
      if (this.method === 'POST' && this.body) {
        headers['Prefer'] = 'return=representation,resolution=merge-duplicates'
      }
    } else if (this.method === 'PATCH') {
      headers['Prefer'] = 'return=representation'
    }

    const requestOptions = {
      url: url,
      method: this.method,
      header: headers,
      success: (res) => {
        callback({ data: res.data, error: null })
      },
      fail: (err) => {
        callback({ data: null, error: err })
      }
    }

    if (this.body && (this.method === 'POST' || this.method === 'PATCH')) {
      requestOptions.data = this.body
    }

    if (this.method === 'GET') {
      // GET请求需要添加select参数
      if (!url.includes('select=')) {
        requestOptions.url += (url.includes('?') ? '&' : '?') + `select=${this.selectColumns}`
      }
    }

    wx.request(requestOptions)
    return this
  }

  catch(callback) {
    return this.then((result) => {
      if (result.error) {
        callback(result.error)
      }
    })
  }
}

// 创建简单的Supabase客户端
const supabase = {
  from: (table) => {
    return new QueryBuilder(table, supabaseUrl, supabaseAnonKey)
  }
}

module.exports = { supabase }