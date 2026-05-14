<template>
  <div class="home-container">
    <div class="home-content">
      <div class="logo-area">
        <span class="logo-icon">◈</span>
        <span class="logo-text">DApp-Voting</span>
      </div>
      <h1 class="main-title">去中心化电子投票系统</h1>
      <p class="sub-title">基于区块链技术 · 公开透明 · 不可篡改</p>
      <div class="feature-list">
        <div class="feature-item">
          <span class="feature-icon">⛓</span> 链上存证
        </div>
        <div class="feature-item">
          <span class="feature-icon">🛡</span> 白名单防伪
        </div>
        <div class="feature-item">
          <span class="feature-icon">⏱</span> 限时机制
        </div>
      </div>
      <el-button
          type="primary"
          size="large"
          class="connect-btn"
          @click="handleConnect"
          :loading="loading"
      >
        {{ loading ? '连接中...' : '连接钱包启动 DApp' }}
      </el-button>
      <p v-if="!loading" class="hint-text">请确保已安装 MetaMask 插件</p>
    </div>
    <!-- 底部版本信息 -->
    <div class="footer">
      基于区块链的DApp电子投票系统 v1.0.0 | Powered by Ethereum
    </div>
  </div>
</template>
<script setup>
/**
 * 首页视图组件
 * @author 陈志琛
 * @description 展示系统介绍和钱包连接功能
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWeb3 } from '@/composables/useWeb3'
import { useVotingStore } from '@/stores/voting'
import { ElMessage } from 'element-plus'

const router = useRouter()
const { isConnected, connectWallet } = useWeb3()
const votingStore = useVotingStore()
const loading = ref(false)

// 处理钱包连接
async function handleConnect() {
  loading.value = true
  try {
    const success = await connectWallet()
    if (success) {
      await votingStore.ensureContract()
      ElMessage.success('钱包连接成功！')
      // 跳转到投票大厅
      router.push('/app/voting')
    } else {
      ElMessage.error('连接失败，请检查钱包插件')
    }
  } catch (err) {
    ElMessage.error('发生错误: ' + err.message)
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  position: relative;
  text-align: center;
}
.home-content {
  z-index: 10;
  padding: 40px;
  background: rgba(17, 34, 64, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 16px;
  border: 1px solid rgba(100, 255, 218, 0.2);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), 0 0 30px rgba(100, 255, 218, 0.1);
  max-width: 600px;
  width: 90%;
}
.logo-area {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}
.logo-icon {
  font-size: 48px;
  color: #64ffda;
  margin-right: 15px;
  text-shadow: 0 0 20px rgba(100, 255, 218, 0.6);
  animation: glow 2s infinite alternate;
}
@keyframes glow {
  from { text-shadow: 0 0 10px rgba(100, 255, 218, 0.4); }
  to { text-shadow: 0 0 25px rgba(100, 255, 218, 0.8); }
}
.logo-text {
  font-family: 'Orbitron', sans-serif;
  font-size: 36px;
  font-weight: bold;
  color: #e6f1ff;
  letter-spacing: 3px;
}
.main-title {
  font-family: 'Rajdhani', sans-serif;
  font-size: 32px;
  color: #ccd6f6;
  margin: 0 0 15px 0;
  font-weight: 600;
}
.sub-title {
  color: #8892b0;
  font-size: 16px;
  margin-bottom: 35px;
  letter-spacing: 2px;
}
.feature-list {
  display: flex;
  justify-content: space-around;
  margin-bottom: 40px;
}
.feature-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  color: #64ffda;
  font-size: 14px;
  background: rgba(100, 255, 218, 0.05);
  padding: 15px;
  border-radius: 8px;
  border: 1px solid rgba(100, 255, 218, 0.1);
  width: 30%;
}
.feature-icon {
  font-size: 24px;
}
.connect-btn {
  width: 100%;
  height: 55px;
  font-size: 18px !important;
  font-weight: bold !important;
  letter-spacing: 2px;
  background-color: #00adb5 !important;
  border-color: #00adb5 !important;
  color: #0a192f !important;
  transition: all 0.3s !important;
}
.connect-btn:hover {
  background-color: #64ffda !important;
  box-shadow: 0 0 25px rgba(100, 255, 218, 0.5) !important;
  transform: translateY(-2px);
}
.hint-text {
  margin-top: 20px;
  color: #4a5568;
  font-size: 13px;
}
.footer {
  position: absolute;
  bottom: 20px;
  color: #4a5568;
  font-size: 13px;
  letter-spacing: 1px;
}
</style>