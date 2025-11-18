// 目标数据库连接配置
import { createClient } from '@supabase/supabase-js'

const targetSupabaseUrl = 'https://hmnjuntvubqvbpeyqoxw.supabase.co'
const targetSupabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhtbmp1bnR2dWJxdmJwZXlxb3h3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM0MjEwNDYsImV4cCI6MjA3ODk5NzA0Nn0.BCp0_8M3OhlIhLQ4fz54le-sWqZeUx9JDRXr1XRsX8g'

export const targetSupabase = createClient(targetSupabaseUrl, targetSupabaseAnonKey)