<template>
  <AdminLayout>
    <div class="user-management">
      <div class="page-header">
        <h1>用户管理</h1>
        <p>管理系统用户账户和权限</p>
      </div>

      <!-- 搜索和筛选 -->
      <a-card class="search-card">
        <a-form layout="inline" :model="searchForm" @finish="handleSearch">
          <a-form-item label="用户名">
            <a-input
              v-model:value="searchForm.username"
              placeholder="输入用户名"
              allow-clear
            />
          </a-form-item>
          
          <a-form-item label="角色">
            <a-select
              v-model:value="searchForm.role"
              placeholder="选择角色"
              style="width: 120px"
              allow-clear
            >
              <a-select-option value="user">普通用户</a-select-option>
              <a-select-option value="admin">管理员</a-select-option>
            </a-select>
          </a-form-item>
          
          <a-form-item>
            <a-button type="primary" html-type="submit" :loading="loading">
              <template #icon><search-outlined /></template>
              搜索
            </a-button>
            <a-button style="margin-left: 8px" @click="resetSearch">重置</a-button>
          </a-form-item>
        </a-form>
      </a-card>

      <!-- 用户列表 -->
      <a-card class="users-card">
        <template #extra>
          <a-button type="primary" @click="showAddModal">
            <template #icon><user-add-outlined /></template>
            添加用户
          </a-button>
        </template>

        <a-table
          :columns="columns"
          :data-source="users"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          row-key="id"
        >
          <template #role="{ record }">
            <a-tag :color="record.role === 'admin' ? 'red' : 'blue'">
              {{ record.role === 'admin' ? '管理员' : '普通用户' }}
            </a-tag>
          </template>

          <template #createdAt="{ record }">
            {{ formatDate(record.created_at) }}
          </template>

          <template #action="{ record }">
            <a-space>
              <a-button size="small" @click="viewUser(record)">查看</a-button>
              <a-button size="small" @click="editUser(record)">编辑</a-button>
              <a-button 
                size="small" 
                danger 
                @click="deleteUser(record)"
                :disabled="record.role === 'admin' && record.id === currentUser.id"
              >
                删除
              </a-button>
            </a-space>
          </template>
        </a-table>
      </a-card>

      <!-- 添加/编辑用户模态框 -->
      <a-modal
        v-model:visible="userModal.visible"
        :title="userModal.isEdit ? '编辑用户' : '添加用户'"
        @ok="handleUserSubmit"
        @cancel="handleUserCancel"
        :confirm-loading="userModal.loading"
      >
        <a-form
          ref="userFormRef"
          :model="userForm"
          :rules="userRules"
          layout="vertical"
        >
          <a-form-item label="用户名" name="username">
            <a-input v-model:value="userForm.username" :disabled="userModal.isEdit" />
          </a-form-item>
          
          <a-form-item v-if="!userModal.isEdit" label="密码" name="password">
            <a-input-password v-model:value="userForm.password" />
          </a-form-item>
          
          <a-form-item v-if="!userModal.isEdit" label="确认密码" name="confirmPassword">
            <a-input-password v-model:value="userForm.confirmPassword" />
          </a-form-item>
          
          <a-form-item label="邮箱" name="email">
            <a-input v-model:value="userForm.email" />
          </a-form-item>
          
          <a-form-item label="显示名称" name="displayName">
            <a-input v-model:value="userForm.displayName" />
          </a-form-item>
          
          <a-form-item label="角色" name="role">
            <a-select v-model:value="userForm.role">
              <a-select-option value="user">普通用户</a-select-option>
              <a-select-option value="admin">管理员</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </a-modal>

      <!-- 用户详情模态框 -->
      <a-modal
        v-model:visible="detailModal.visible"
        title="用户详情"
        :footer="null"
        width="600px"
      >
        <a-descriptions bordered :column="2" v-if="selectedUser">
          <a-descriptions-item label="用户名">{{ selectedUser.username }}</a-descriptions-item>
          <a-descriptions-item label="邮箱">{{ selectedUser.email }}</a-descriptions-item>
          <a-descriptions-item label="显示名称">{{ selectedUser.displayName }}</a-descriptions-item>
          <a-descriptions-item label="角色">
            <a-tag :color="selectedUser.role === 'admin' ? 'red' : 'blue'">
              {{ selectedUser.role === 'admin' ? '管理员' : '普通用户' }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="大学">{{ selectedUser.university || '未设置' }}</a-descriptions-item>
          <a-descriptions-item label="注册时间">{{ formatDate(selectedUser.created_at) }}</a-descriptions-item>
          <a-descriptions-item label="最后更新">{{ formatDate(selectedUser.updated_at) }}</a-descriptions-item>
        </a-descriptions>
      </a-modal>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { SearchOutlined, UserAddOutlined } from '@ant-design/icons-vue'
import authService from '../../services/authService'
import adminService from '../../services/adminService'

// 表格列配置
const columns = [
  {
    title: '用户名',
    dataIndex: 'username',
    key: 'username',
    width: 120
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
    width: 200
  },
  {
    title: '显示名称',
    dataIndex: 'displayName',
    key: 'displayName',
    width: 150
  },
  {
    title: '角色',
    dataIndex: 'role',
    key: 'role',
    width: 100,
    slots: { customRender: 'role' }
  },
  {
    title: '大学',
    dataIndex: 'university',
    key: 'university',
    width: 150
  },
  {
    title: '注册时间',
    dataIndex: 'created_at',
    key: 'created_at',
    width: 150,
    slots: { customRender: 'createdAt' }
  },
  {
    title: '操作',
    key: 'action',
    width: 200,
    slots: { customRender: 'action' }
  }
]

const loading = ref(false)
const users = ref([])
const selectedUser = ref(null)
const currentUser = computed(() => adminService.getCurrentAdmin())

// 搜索表单
const searchForm = reactive({
  username: '',
  role: ''
})

// 分页配置
const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: total => `共 ${total} 条记录`
})

// 用户模态框
const userModal = reactive({
  visible: false,
  loading: false,
  isEdit: false
})

const userForm = reactive({
  id: '',
  username: '',
  password: '',
  confirmPassword: '',
  email: '',
  displayName: '',
  role: 'user'
})

const userRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { min: 3, max: 50, message: '用户名长度在3-50个字符之间' }
  ],
  email: [
    { required: true, message: '请输入邮箱' },
    { type: 'email', message: '请输入有效的邮箱地址' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { min: 6, message: '密码长度不能少于6个字符' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码' },
    {
      validator: (rule, value) => {
        if (value !== userForm.password) {
          return Promise.reject('两次输入的密码不一致')
        }
        return Promise.resolve()
      }
    }
  ],
  role: [
    { required: true, message: '请选择角色' }
  ]
}

// 详情模态框
const detailModal = reactive({
  visible: false
})



const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const loadUsers = async () => {
  loading.value = true
  
  try {
    // 调用管理员服务获取用户列表
    const allUsers = await adminService.getAllUsers()
    
    // 应用搜索过滤
    let filteredUsers = allUsers
    
    if (searchForm.username) {
      filteredUsers = filteredUsers.filter(user => 
        user.username && user.username.includes(searchForm.username)
      )
    }
    
    if (searchForm.role) {
      filteredUsers = filteredUsers.filter(user => 
        user.role === searchForm.role
      )
    }
    
    users.value = filteredUsers
    pagination.total = filteredUsers.length
    
  } catch (error) {
    console.error('加载用户数据失败:', error)
    message.error('加载用户数据失败')
    
    // 如果API调用失败，使用空数组
    users.value = []
    pagination.total = 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.current = 1
  loadUsers()
}

const resetSearch = () => {
  Object.keys(searchForm).forEach(key => {
    searchForm[key] = ''
  })
  pagination.current = 1
  loadUsers()
}

const handleTableChange = (newPagination) => {
  Object.assign(pagination, newPagination)
  loadUsers()
}

const showAddModal = () => {
  userModal.isEdit = false
  userModal.visible = true
  
  // 重置表单
  Object.keys(userForm).forEach(key => {
    if (key !== 'role') {
      userForm[key] = ''
    }
  })
  userForm.role = 'user'
}

const editUser = (user) => {
  userModal.isEdit = true
  userModal.visible = true
  
  // 填充表单
  Object.keys(userForm).forEach(key => {
    if (user[key] !== undefined) {
      userForm[key] = user[key]
    }
  })
}

const viewUser = (user) => {
  selectedUser.value = user
  detailModal.visible = true
}

const deleteUser = (user) => {
  if (user.role === 'admin' && user.id === currentUser.value.id) {
    message.error('不能删除自己的管理员账户')
    return
  }
  
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除用户 "${user.username}" 吗？此操作不可恢复。`,
    okText: '确认',
    cancelText: '取消',
    onOk: async () => {
      try {
        await adminService.deleteUser(user.id)
        message.success('用户删除成功')
        loadUsers()
        
      } catch (error) {
        console.error('删除用户失败:', error)
        message.error(`删除用户失败: ${error.message}`)
      }
    }
  })
}

const handleUserSubmit = async () => {
  userModal.loading = true
  
  try {
    if (userModal.isEdit) {
      // 编辑用户
      await adminService.updateUser(userForm.id, {
        displayName: userForm.displayName,
        email: userForm.email,
        role: userForm.role
      })
      message.success('用户信息更新成功')
    } else {
      // 创建新用户
      await adminService.createUser({
        username: userForm.username,
        password: userForm.password,
        displayName: userForm.displayName,
        email: userForm.email,
        role: userForm.role
      })
      message.success('用户添加成功')
    }
    
    userModal.visible = false
    loadUsers()
    
  } catch (error) {
    console.error('操作失败:', error)
    message.error(`操作失败: ${error.message}`)
  } finally {
    userModal.loading = false
  }
}

const handleUserCancel = () => {
  userModal.visible = false
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.user-management {
  padding: 0;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #262626;
  font-size: 24px;
}

.page-header p {
  margin: 0;
  color: #8c8c8c;
  font-size: 14px;
}

.search-card {
  margin-bottom: 16px;
}

.users-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 1024px) {
  .page-header h1 {
    font-size: 22px;
  }
  
  .search-card :deep(.ant-form-item) {
    margin-bottom: 16px;
  }
  
  .search-card :deep(.ant-form-item-label) {
    width: 100%;
    text-align: left;
  }
  
  .users-card :deep(.ant-table-thead > tr > th),
  .users-card :deep(.ant-table-tbody > tr > td) {
    padding: 8px 4px;
    font-size: 14px;
  }
}

@media (max-width: 768px) {
  .page-header h1 {
    font-size: 20px;
  }
  
  .page-header p {
    font-size: 13px;
  }
  
  .search-card :deep(.ant-form-item) {
    margin-bottom: 12px;
  }
  
  .users-card :deep(.ant-table-thead > tr > th),
  .users-card :deep(.ant-table-tbody > tr > td) {
    padding: 6px 2px;
    font-size: 13px;
  }
  
  .users-card :deep(.ant-pagination) {
    font-size: 13px;
  }
  
  .users-card :deep(.ant-btn) {
    font-size: 12px;
    padding: 4px 8px;
  }
}

@media (max-width: 480px) {
  .page-header h1 {
    font-size: 18px;
  }
  
  .search-card :deep(.ant-form-item) {
    margin-bottom: 8px;
  }
  
  .users-card :deep(.ant-table) {
    font-size: 12px;
  }
  
  .users-card :deep(.ant-table-thead > tr > th),
  .users-card :deep(.ant-table-tbody > tr > td) {
    padding: 4px 1px;
    font-size: 12px;
  }
  
  .users-card :deep(.ant-pagination) {
    font-size: 12px;
  }
  
  .users-card :deep(.ant-pagination-item) {
    min-width: 28px;
    height: 28px;
  }
  
  .users-card :deep(.ant-pagination-prev,
                    .ant-pagination-next,
                    .ant-pagination-jump-prev,
                    .ant-pagination-jump-next) {
    min-width: 28px;
    height: 28px;
  }
}
</style>