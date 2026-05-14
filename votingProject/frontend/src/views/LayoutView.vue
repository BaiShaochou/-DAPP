<template>
  <div class="layout-container">
    <div class="navbar">
      <div class="nav-left">
        <span class="logo-icon">◈</span>
        <span class="logo-text">DApp-Voting</span>
      </div>
      <div class="nav-right">
        <!-- 导航链接 -->
        <router-link to="/app/voting" class="nav-link" active-class="active-link">
          <span class="link-icon">☷</span> 投票大厅
        </router-link>
        <router-link to="/app/admin" class="nav-link" active-class="active-link">
          <span class="link-icon">⚙</span> 管理后台
        </router-link>
        <el-button @click="handleConnect" :type="isConnected ? 'success' : 'primary'" size="small">
          {{ isConnected ? `${account.slice(0,4)}...${account.slice(-4)}` : '连接钱包' }}
        </el-button>
      </div>
    </div>
    <div class="main-content">
      <router-view />
    </div>
  </div>
</template>
<script setup>
/**
 * 布局视图组件
 * @author 陈志琛
 * @description 提供导航栏和钱包连接功能，包裹所有子路由
 */
import { useWeb3 } from '@/composables/useWeb3'

const { isConnected, account, connectWallet } = useWeb3()

// 处理钱包连接
async function handleConnect() {
  if (!isConnected.value) {
    await connectWallet()
  }
}
</script>
<style scoped>
.layout-container {
  min-height: 100vh;
}
.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 40px;
  height: 70px;
  background: rgba(10, 25, 47, 0.85);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(100, 255, 218, 0.1);
  box-shadow: 0 10px 30px -10px rgba(2, 12, 27, 0.7);
}
.nav-left {
  display: flex;
  align-items: center;
}
.logo-icon {
  font-size: 28px;
  color: #64ffda;
  margin-right: 10px;
  text-shadow: 0 0 10px rgba(100, 255, 218, 0.5);
}
.logo-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 20px;
  font-weight: bold;
  color: #ccd6f6;
  letter-spacing: 2px;
}
.nav-right {
  display: flex;
  align-items: center;
  gap: 30px;
}
.nav-link {
  text-decoration: none;
  color: #8892b0;
  font-weight: 500;
  font-size: 16px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}
.nav-link:hover, .active-link {
  color: #64ffda !important;
  text-shadow: 0 0 8px rgba(100, 255, 218, 0.3);
}
.link-icon { font-size: 18px; }
.main-content {
  max-width: 1400px;
  margin: 40px auto;
  padding: 0 30px;
}
</style>