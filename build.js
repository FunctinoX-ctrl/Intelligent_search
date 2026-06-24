const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const projectRoot = __dirname
const backendDir = path.join(projectRoot, 'backend')
const distDir = path.join(projectRoot, 'dist')
const unpackedBackendDir = path.join(distDir, 'win-unpacked', 'resources', 'backend')

console.log('步骤1: 执行 electron-builder 打包...')
try {
  execSync('npx electron-builder --win --x64 --dir', {
    cwd: projectRoot,
    stdio: 'inherit'
  })
} catch (e) {
  console.error('打包失败:', e.message)
  process.exit(1)
}

console.log('\n步骤2: 复制后端 node_modules...')
const backendNodeModules = path.join(backendDir, 'node_modules')
const targetNodeModules = path.join(unpackedBackendDir, 'node_modules')

if (fs.existsSync(backendNodeModules)) {
  if (!fs.existsSync(targetNodeModules)) {
    fs.mkdirSync(targetNodeModules, { recursive: true })
  }
  
  console.log('复制中，请稍候...')
  copyDirSync(backendNodeModules, targetNodeModules)
  console.log('后端 node_modules 复制完成')
} else {
  console.warn('警告: 后端 node_modules 不存在')
}

console.log('\n步骤3: 重新生成 NSIS 安装包...')
try {
  execSync('npx electron-builder --win --x64 --prepackaged dist/win-unpacked', {
    cwd: projectRoot,
    stdio: 'inherit'
  })
} catch (e) {
  console.error('生成安装包失败:', e.message)
  process.exit(1)
}

console.log('\n✅ 打包完成！')
const exePath = path.join(distDir, '智能搜索-Setup-1.0.0-x64.exe')
if (fs.existsSync(exePath)) {
  const sizeMB = (fs.statSync(exePath).size / (1024 * 1024)).toFixed(2)
  console.log(`安装包位置: ${exePath}`)
  console.log(`安装包大小: ${sizeMB} MB`)
}

function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }
  
  const entries = fs.readdirSync(src, { withFileTypes: true })
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}
