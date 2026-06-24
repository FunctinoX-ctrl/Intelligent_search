const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  personalLogin: (username, password) => ipcRenderer.invoke('auth:personal-login', username, password),
  personalRegister: (username, password, email) => ipcRenderer.invoke('auth:personal-register', username, password, email),
  enterpriseLogin: (email, employeeId, password) => ipcRenderer.invoke('auth:enterprise-login', email, employeeId, password),
  enterpriseRegister: (data) => ipcRenderer.invoke('auth:enterprise-register', data),
  getUserInfo: () => ipcRenderer.invoke('auth:getUserInfo'),
  logout: () => ipcRenderer.invoke('auth:logout'),

  getPersonalUsers: (page, pageSize) => ipcRenderer.invoke('admin:get-personal-users', page, pageSize),
  updatePersonalUserRole: (id, role) => ipcRenderer.invoke('admin:update-personal-role', id, role),
  updatePersonalUserStatus: (id, status) => ipcRenderer.invoke('admin:update-personal-status', id, status),
  deletePersonalUser: (id) => ipcRenderer.invoke('admin:delete-personal-user', id),

  getEnterpriseUsers: (page, pageSize) => ipcRenderer.invoke('admin:get-enterprise-users', page, pageSize),
  updateEnterpriseUserRole: (id, role) => ipcRenderer.invoke('admin:update-enterprise-role', id, role),
  updateEnterpriseUserStatus: (id, status) => ipcRenderer.invoke('admin:update-enterprise-status', id, status),
  deleteEnterpriseUser: (id) => ipcRenderer.invoke('admin:delete-enterprise-user', id),

  getCompanies: (page, pageSize) => ipcRenderer.invoke('admin:get-companies', page, pageSize),
  createCompany: (data) => ipcRenderer.invoke('admin:create-company', data),
  updateCompany: (id, data) => ipcRenderer.invoke('admin:update-company', id, data),
  deleteCompany: (id) => ipcRenderer.invoke('admin:delete-company', id),

  getPostList: (page, pageSize, keyword, category) => ipcRenderer.invoke('posts:get-list', page, pageSize, keyword, category),
  searchPosts: (keyword, page, pageSize) => ipcRenderer.invoke('posts:search', keyword, page, pageSize),
  getHotPosts: (limit) => ipcRenderer.invoke('posts:get-hot', limit),
  getPostDetail: (id) => ipcRenderer.invoke('posts:get-detail', id),
  createPost: (data) => ipcRenderer.invoke('posts:create', data),
  updatePost: (id, data) => ipcRenderer.invoke('posts:update', id, data),
  deletePost: (id) => ipcRenderer.invoke('posts:delete', id),
  
  likePost: (id) => ipcRenderer.invoke('posts:like', id),
  getLikeStatus: (id) => ipcRenderer.invoke('posts:like-status', id),
  
  getComments: (postId, page, pageSize) => ipcRenderer.invoke('posts:get-comments', postId, page, pageSize),
  createComment: (postId, content, parentId) => ipcRenderer.invoke('posts:create-comment', postId, content, parentId),
  deleteComment: (id) => ipcRenderer.invoke('posts:delete-comment', id),

  getServerStatus: () => ipcRenderer.invoke('server:get-status'),
  reconnectServer: () => ipcRenderer.invoke('server:reconnect'),
  onServerStatus: (callback) => {
    ipcRenderer.on('server:status', (event, data) => callback(data))
  },
  onScanProgress: (callback) => {
    ipcRenderer.on('server:scan-progress', (event, data) => callback(data))
  }
})
