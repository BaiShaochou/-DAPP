<template>
  <router-view />
</template>

<script setup>
/**
 * 应用根组件
 * @author 陈志琛
 * @description 负责初始化Web3连接和合约实例
 */
import { onMounted, watch } from 'vue'
import { useWeb3 } from '@/composables/useWeb3'
import { useVotingStore } from '@/stores/voting'

const { isConnected, tryAutoConnect } = useWeb3()
const votingStore = useVotingStore()

// 应用挂载时尝试自动连接钱包
onMounted(async () => {
  const connected = await tryAutoConnect()
  if (connected) {
    await votingStore.ensureContract()
  }
})

// 监听连接状态，确保连接成功后加载合约
watch(isConnected, async (newVal) => {
  if (newVal && !votingStore.contract) {
    await votingStore.ensureContract()
  }
})
</script>
<style>
/* 引入科技感字体 */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&family=Rajdhani:wght@400;500;700&display=swap');

/* 全局样式设置 - 深色科技主题 */
body {
  margin: 0;
  padding: 0;
  background-color: #0a192f;
  /* 六边形网格背景图案 */
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg id='hexagons' fill='%2300adb5' fill-opacity='0.15' fill-rule='nonzero'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5V0h-2v6.35L0 12.69v2.3zm0 18.5L12.98 41v8h-2v-6.85L0 35.81v-2.3zM15 0v7.5L27.99 15H28v-2.31h-.01L17 6.35V0h-2zm0 49v-8l12.99-7.5H28v2.31h-.01L17 42.15V49h-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  background-size: 120px 210px;
  color: #ccd6f6;
  font-family: 'Rajdhani', sans-serif;
  min-height: 100vh;
}
/* Element Plus 深色主题全局覆盖 */
.el-card {
  background: rgba(17, 34, 64, 0.7) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(100, 255, 218, 0.1) !important;
  color: #ccd6f6 !important;
  box-shadow: 0 10px 30px -15px rgba(2, 12, 27, 0.7) !important;
  border-radius: 8px !important;
}
.el-card__header {
  border-bottom: 1px solid rgba(100, 255, 218, 0.1) !important;
  color: #64ffda !important;
  font-weight: bold;
}
.el-input__wrapper {
  background-color: rgba(10, 25, 47, 0.8) !important;
  box-shadow: 0 0 0 1px rgba(100, 255, 218, 0.2) inset !important;
  border-radius: 4px !important;
}
.el-input__inner {
  color: #ccd6f6 !important;
}
.el-input__inner::placeholder {
  color: #4a5568 !important;
}
.el-alert {
  background: rgba(17, 34, 64, 0.6) !important;
  border: 1px solid rgba(100, 255, 218, 0.2) !important;
}
.el-alert__title { color: #ccd6f6 !important; }
.el-alert__description { color: #8892b0 !important; }
/* 按钮优化 */
.el-button--primary {
  background-color: transparent !important;
  border: 1px solid #64ffda !important;
  color: #64ffda !important;
  font-weight: bold;
}
.el-button--primary:hover,
.el-button--primary:focus {
  background-color: rgba(100, 255, 218, 0.1) !important;
  box-shadow: 0 0 15px rgba(100, 255, 218, 0.3) !important;
}
.el-button--success {
  background-color: #00adb5 !important;
  border-color: #00adb5 !important;
  color: #0a192f !important;
  font-weight: bold;
}
.el-button--success:hover {
  background-color: #64ffda !important;
  box-shadow: 0 0 15px rgba(100, 255, 218, 0.4) !important;
}
.el-button--danger {
  background-color: transparent !important;
  border: 1px solid #ff6b6b !important;
  color: #ff6b6b !important;
}
.el-button--danger:hover {
  background-color: rgba(255, 107, 107, 0.1) !important;
}
.el-button--warning {
  background-color: #e6a23c !important;
  border-color: #e6a23c !important;
  color: #0a192f !important;
}
.el-tag {
  background: rgba(100, 255, 218, 0.1) !important;
  border: 1px solid rgba(100, 255, 218, 0.2) !important;
  color: #64ffda !important;
}
.el-tag--info { color: #8892b0 !important; border-color: rgba(136,146,176,0.2) !important; background: rgba(136,146,176,0.1) !important;}
.el-tag--danger { color: #ff6b6b !important; border-color: rgba(255,107,107,0.2) !important; background: rgba(255,107,107,0.1) !important;}
.el-progress__text { color: #ccd6f6 !important; }
.el-empty__description p { color: #8892b0 !important; }
/* 滚动条美化 */
::-webkit-scrollbar { width: 6px; }
::-webkit-scrollbar-track { background: #0a192f; }
::-webkit-scrollbar-thumb { background: #64ffda; border-radius: 3px; }
</style>