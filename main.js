const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const fs = require('fs')
const net = require('net')
const os = require('os')
const { fork } = require('child_process')

app.setPath('userData', path.join(__dirname, '.electron-userdata'))

let backendProcess = null
let currentToken = null
let currentUser = null

// 配置文件路径
const configPath = app.isPackaged
  ? path.join(path.dirname(process.execPath), 'config', 'server.json')
  : path.join(__dirname, 'config', 'server.json')

// 默认服务器地址
const DEFAULT_API_BASE = 'http://127.0.0.1:3000'
const SERVER_PORT = 3000

let API_BASE = DEFAULT_API_BASE
let serverStatus = 'connecting'
let serverStatusMessage = '正在连接服务器...'

function getServerConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
      return config.serverIP || null
    }
  } catch (error) {
    console.error('读取服务器配置失败:', error)
  }
  return null
}

function saveServerConfig(serverUrl) {
  try {
    const configDir = path.dirname(configPath)
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true })
    }
    const config = { serverIP: serverUrl }
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8')
    return true
  } catch (error) {
    console.error('保存服务器配置失败:', error)
    return false
  }
}

function getLocalIPs() {
  const interfaces = os.networkInterfaces()
  const ips = []
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address)
      }
    }
  }
  return ips
}

function scanPort(ip, port, timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket()
    socket.setTimeout(timeout)
    socket.on('connect', () => {
      socket.destroy()
      resolve(true)
    })
    socket.on('timeout', () => {
      socket.destroy()
      resolve(false)
    })
    socket.on('error', () => {
      resolve(false)
    })
    socket.connect(port, ip)
  })
}

async function checkServerHealth(ip, port = SERVER_PORT) {
  try {
    const response = await fetch(`http://${ip}:${port}/api/health`, { signal: AbortSignal.timeout(2000) })
    if (response.ok) {
      const data = await response.json()
      if (data.status === 'ok') {
        return { ip, port, url: `http://${ip}:${port}`, valid: true }
      }
    }
  } catch (e) {}
  return null
}

async function checkServerByUrl(url) {
  try {
    const response = await fetch(`${url}/api/health`, { signal: AbortSignal.timeout(3000) })
    if (response.ok) {
      const data = await response.json()
      return data.status === 'ok'
    }
  } catch (e) {}
  return false
}

async function scanLAN(port = SERVER_PORT, onProgress = null) {
  const localIPs = getLocalIPs()
  const found = []
  const scanned = []
  let total = 254 * localIPs.length

  for (const localIP of localIPs) {
    const parts = localIP.split('.')
    if (parts.length !== 4) continue
    const baseIP = parts.slice(0, 3).join('.')
    
    const batchSize = 30
    for (let i = 1; i <= 254; i += batchSize) {
      const batch = []
      for (let j = 0; j < batchSize && i + j <= 254; j++) {
        const ip = `${baseIP}.${i + j}`
        if (ip === localIP) continue
        batch.push(
          scanPort(ip, port, 600).then(async (open) => {
            if (open) {
              const server = await checkServerHealth(ip, port)
              if (server) {
                found.push(server)
              }
            }
            scanned.push(ip)
            if (onProgress) {
              onProgress(scanned.length, total, found.length)
            }
          })
        )
      }
      await Promise.all(batch)
      if (found.length > 0) break
    }
    if (found.length > 0) break
  }

  return found
}

let mainWindowRef = null

function broadcastStatus() {
  if (mainWindowRef && !mainWindowRef.isDestroyed()) {
    mainWindowRef.webContents.send('server:status', {
      status: serverStatus,
      message: serverStatusMessage,
      url: API_BASE
    })
  }
}

async function initServerConnection() {
  const savedServer = getServerConfig()
  
  if (savedServer) {
    serverStatus = 'connecting'
    serverStatusMessage = '正在连接服务器...'
    broadcastStatus()
    
    const ok = await checkServerByUrl(savedServer)
    if (ok) {
      API_BASE = savedServer
      serverStatus = 'connected'
      serverStatusMessage = '服务器连接成功'
      console.log('使用缓存的服务器:', API_BASE)
      broadcastStatus()
      return true
    }
    console.log('缓存的服务器连接失败，开始搜索局域网...')
  }

  serverStatus = 'scanning'
  serverStatusMessage = '正在搜索局域网服务器...'
  broadcastStatus()

  const onProgress = (scanned, total, foundCount) => {
    if (mainWindowRef && !mainWindowRef.isDestroyed()) {
      mainWindowRef.webContents.send('server:scan-progress', { scanned, total, found: foundCount })
    }
  }

  const servers = await scanLAN(SERVER_PORT, onProgress)
  
  if (servers.length > 0) {
    API_BASE = servers[0].url
    saveServerConfig(API_BASE)
    serverStatus = 'connected'
    serverStatusMessage = '服务器连接成功'
    console.log('找到服务器:', API_BASE)
    broadcastStatus()
    return true
  }

  serverStatus = 'failed'
  serverStatusMessage = '无法连接服务器，请检查网络连接'
  console.log('未找到可用服务器')
  broadcastStatus()
  return false
}

async function reconnectServer() {
  return await initServerConnection()
}

async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
  if (currentToken) {
    headers['Authorization'] = `Bearer ${currentToken}`
  }
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })
  return await response.json()
}

function startBackend() {
  const isPackaged = app.isPackaged
  let backendDir, backendPath

  if (isPackaged) {
    backendDir = path.join(process.resourcesPath, 'backend')
    backendPath = path.join(backendDir, 'server.js')
  } else {
    backendDir = path.join(__dirname, 'backend')
    backendPath = path.join(backendDir, 'server.js')
  }

  console.log('启动后端服务:', backendPath)
  
  const { spawn } = require('child_process')
  const nodePath = process.execPath
  
  if (isPackaged) {
    backendProcess = spawn(nodePath, [backendPath], {
      cwd: backendDir,
      stdio: 'inherit',
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' }
    })
  } else {
    backendProcess = spawn('node', [backendPath], {
      cwd: backendDir,
      stdio: 'inherit',
      shell: true
    })
  }
  
  backendProcess.on('exit', (code) => {
    console.log(`后端服务退出，代码: ${code}`)
  })
  backendProcess.on('error', (err) => {
    console.error('后端服务错误:', err)
  })
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })
  mainWindowRef = mainWindow
  mainWindow.maximize()
  mainWindow.show()
  mainWindow.loadFile(path.join('pages', 'login.html'))
  
  setTimeout(() => {
    initServerConnection()
  }, 500)
}

ipcMain.handle('auth:personal-login', async (event, username, password) => {
  try {
    const result = await apiRequest('/api/auth/personal/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    })
    if (result.success && result.data?.token) {
      currentToken = result.data.token
      currentUser = result.data.user
    }
    return result
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('auth:personal-register', async (event, username, password, email) => {
  try {
    return await apiRequest('/api/auth/personal/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, email })
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('auth:enterprise-login', async (event, email, employeeId, password) => {
  try {
    const result = await apiRequest('/api/auth/enterprise/login', {
      method: 'POST',
      body: JSON.stringify({ email, employeeId, password })
    })
    if (result.success && result.data?.token) {
      currentToken = result.data.token
      currentUser = result.data.user
    }
    return result
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('auth:enterprise-register', async (event, data) => {
  try {
    return await apiRequest('/api/auth/enterprise/register', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('auth:getUserInfo', async () => {
  if (!currentToken) {
    return { success: false, message: '未登录' }
  }
  try {
    return await apiRequest('/api/auth/user')
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('auth:logout', () => {
  currentToken = null
  currentUser = null
  return { success: true }
})

ipcMain.handle('admin:get-personal-users', async (event, page = 1, pageSize = 20) => {
  try {
    return await apiRequest(`/api/auth/admin/personal-users?page=${page}&pageSize=${pageSize}`)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:update-personal-role', async (event, id, role) => {
  try {
    return await apiRequest(`/api/auth/admin/personal-users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:update-personal-status', async (event, id, status) => {
  try {
    return await apiRequest(`/api/auth/admin/personal-users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:delete-personal-user', async (event, id) => {
  try {
    return await apiRequest(`/api/auth/admin/personal-users/${id}`, { method: 'DELETE' })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:get-enterprise-users', async (event, page = 1, pageSize = 20) => {
  try {
    return await apiRequest(`/api/auth/admin/enterprise-users?page=${page}&pageSize=${pageSize}`)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:update-enterprise-role', async (event, id, role) => {
  try {
    return await apiRequest(`/api/auth/admin/enterprise-users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:update-enterprise-status', async (event, id, status) => {
  try {
    return await apiRequest(`/api/auth/admin/enterprise-users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:delete-enterprise-user', async (event, id) => {
  try {
    return await apiRequest(`/api/auth/admin/enterprise-users/${id}`, { method: 'DELETE' })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:get-companies', async (event, page = 1, pageSize = 20) => {
  try {
    return await apiRequest(`/api/auth/admin/companies?page=${page}&pageSize=${pageSize}`)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:create-company', async (event, data) => {
  try {
    return await apiRequest('/api/auth/admin/companies', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:update-company', async (event, id, data) => {
  try {
    return await apiRequest(`/api/auth/admin/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('admin:delete-company', async (event, id) => {
  try {
    return await apiRequest(`/api/auth/admin/companies/${id}`, { method: 'DELETE' })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:get-list', async (event, page = 1, pageSize = 10, keyword = '', category = '') => {
  try {
    let url = `/api/posts/list?page=${page}&pageSize=${pageSize}`
    if (keyword) url += `&keyword=${encodeURIComponent(keyword)}`
    if (category) url += `&category=${encodeURIComponent(category)}`
    return await apiRequest(url)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:search', async (event, keyword, page = 1, pageSize = 10) => {
  try {
    return await apiRequest(`/api/posts/search?keyword=${encodeURIComponent(keyword)}&page=${page}&pageSize=${pageSize}`)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:get-hot', async (event, limit = 10) => {
  try {
    return await apiRequest(`/api/posts/hot?limit=${limit}`)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:get-detail', async (event, id) => {
  try {
    return await apiRequest(`/api/posts/detail/${id}`)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:create', async (event, data) => {
  try {
    return await apiRequest('/api/posts/create', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:update', async (event, id, data) => {
  try {
    return await apiRequest(`/api/posts/update/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:delete', async (event, id) => {
  try {
    return await apiRequest(`/api/posts/delete/${id}`, { method: 'DELETE' })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:like', async (event, id) => {
  try {
    return await apiRequest(`/api/posts/${id}/like`, { method: 'POST' })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:like-status', async (event, id) => {
  try {
    return await apiRequest(`/api/posts/${id}/like/status`)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:get-comments', async (event, postId, page = 1, pageSize = 20) => {
  try {
    return await apiRequest(`/api/posts/${postId}/comments?page=${page}&pageSize=${pageSize}`)
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:create-comment', async (event, postId, content, parentId = 0) => {
  try {
    return await apiRequest(`/api/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_id: parentId })
    })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('posts:delete-comment', async (event, id) => {
  try {
    return await apiRequest(`/api/posts/comments/${id}`, { method: 'DELETE' })
  } catch (error) {
    return { success: false, message: '连接服务器失败: ' + error.message }
  }
})

ipcMain.handle('server:get-status', async () => {
  return {
    success: true,
    data: {
      status: serverStatus,
      message: serverStatusMessage,
      url: API_BASE
    }
  }
})

ipcMain.handle('server:reconnect', async () => {
  try {
    const result = await reconnectServer()
    return { success: result, message: serverStatusMessage }
  } catch (error) {
    return { success: false, message: error.message }
  }
})

app.whenReady().then(() => {
  startBackend()
  setTimeout(() => { createWindow() }, 2000)

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (backendProcess) { backendProcess.kill() }
  if (process.platform !== 'darwin') app.quit()
})
