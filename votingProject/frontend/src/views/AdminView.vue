<template>
  <div class="admin-container">
    <!-- 管理后台头部 -->
    <div class="header-section">
      <div class="header-left">
        <h2 class="main-title">管理后台</h2>
        <div class="sub-title">Administration Control Panel</div>
      </div>
      <div class="header-right">
<!--        <el-button type="primary" @click="$router.push('/app/voting')">-->
<!--          返回投票大厅 ➜-->
<!--        </el-button>-->
      </div>
    </div>
    <el-row :gutter="25">
      <el-col :span="14">
        <el-card shadow="hover" class="mb-25">
          <template #header>
            <div class="card-top">
              <strong>投票项管理 (候选人)</strong>
              <el-tag :type="currentPhase == 0 ? 'success' : 'info'">
                {{ currentPhase == 0 ? '当前可添加' : '已锁定' }}
              </el-tag>
            </div>
          </template>
          <el-input
              v-model="newCandidateName"
              placeholder="输入投票项名称"
              class="mb-15"
              :disabled="currentPhase != 0"
          >
            <template #append>
              <!-- 使用实底青色突出主操作按钮 -->
              <el-button type="success" @click="handleAddCandidate" :loading="loading" :disabled="currentPhase != 0">添加</el-button>
            </template>
          </el-input>
          <div v-for="c in candidates" :key="c.id" class="list-item">
            <span class="item-id">ID: {{ c.id }}</span>
            <span class="item-name">{{ c.name }}</span>
          </div>
          <div v-if="candidates.length === 0" class="empty-list">暂无投票项</div>
        </el-card>
        <el-card shadow="hover">
          <template #header><strong>轮次控制</strong></template>
          <div v-if="currentPhase == 0">
            <el-input v-model="startTitle" placeholder="输入本轮投票标题" class="mb-15" />
            <el-input v-model="startDuration" placeholder="持续时长(分钟)" type="number" class="mb-15" />
            <el-button type="success" @click="handleStart" :loading="loading" long>启动投票</el-button>
          </div>
          <div v-if="currentPhase == 1">
            <div v-if="isExpired" class="expire-alert">
              投票时间已到期！请手动结束投票并公布结果。
            </div>
            <div v-else class="info-alert" style="margin-bottom: 15px;">
              投票正在进行中，时间到期后需手动点击结束。
            </div>
            <el-button type="danger" @click="handleEnd" :loading="loading" long>结束当前投票</el-button>
          </div>
          <div v-if="currentPhase == 2">
            <el-button type="warning" @click="handleReset" :loading="loading" long>重置并开启下一轮</el-button>
          </div>
        </el-card>
      </el-col>
      <el-col :span="10">
        <el-card shadow="hover" class="mb-25">
          <template #header><strong>投票者白名单管理</strong></template>
          <el-input v-model="voterAddress" placeholder="输入投票者钱包地址 (0x...)" class="mb-15" />
          <el-button-group style="width: 100%;">
            <el-button style="width: 50%;" type="primary" @click="handleAddVoter" :loading="loading">添加</el-button>
            <el-button style="width: 50%;" type="danger" @click="handleRemoveVoter" :loading="loading">移除</el-button>
          </el-button-group>
        </el-card>
        <el-card shadow="hover">
          <template #header>
            <div class="card-top">
              <strong>已记录的白名单</strong>
              <el-tag type="info" size="small">本地缓存</el-tag>
            </div>
          </template>
          <div class="info-alert" style="margin-bottom:10px;">
            因区块链限制，以下为当前浏览器操作产生的记录，非链上全量数据。
          </div>
          <div v-for="voter in votingStore.localVoterList" :key="voter" class="list-item">
            <span class="voter-address">{{ voter.slice(0, 6) }}...{{ voter.slice(-4) }}</span>
            <el-button type="danger" size="small" text @click="quickRemove(voter)">移除</el-button>
          </div>
          <div v-if="votingStore.localVoterList.length === 0" class="empty-list">暂无记录</div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
/**
 * 管理后台视图组件
 * @author 陈志琛
 * @description 提供投票管理功能，包括候选人管理、轮次控制和白名单管理
 */
import { ref, computed, onMounted } from 'vue'
import { useVotingStore } from '@/stores/voting'
import { ElMessage } from 'element-plus'

const votingStore = useVotingStore()
const loading = computed(() => votingStore.loading)
const currentPhase = computed(() => votingStore.currentPhase)
const candidates = computed(() => votingStore.candidates)
const startTitle = ref('')
const startDuration = ref(10)
const newCandidateName = ref('')
const voterAddress = ref('')
// 判断投票是否已过期
const isExpired = computed(() => {
  if (currentPhase.value != 1 || !votingStore.localDeadline) return false
  return Math.floor(Date.now() / 1000) >= votingStore.localDeadline
})

// 组件挂载时加载数据
onMounted(async () => {
  if (votingStore.contract) await votingStore.loadVotingData()
  else await votingStore.ensureContract()
})
async function handleStart() {
  if(!startTitle.value) return ElMessage.warning('请输入标题')
  await votingStore.startVoting(startTitle.value, startDuration.value)
}
async function handleEnd() { await votingStore.endVoting() }
async function handleReset() { await votingStore.resetRound() }
async function handleAddCandidate() {
  if(!newCandidateName.value) return ElMessage.warning('请输入名称')
  await votingStore.addCandidate(newCandidateName.value)
  newCandidateName.value = ''
}
async function handleAddVoter() {
  if(!voterAddress.value || !voterAddress.value.startsWith('0x') || voterAddress.value.length !== 42) {
    return ElMessage.warning('请输入有效的42位钱包地址')
  }
  await votingStore.addVoter(voterAddress.value)
  voterAddress.value = ''
}
async function handleRemoveVoter() {
  if(!voterAddress.value || !voterAddress.value.startsWith('0x') || voterAddress.value.length !== 42) {
    return ElMessage.warning('请输入有效的42位钱包地址')
  }
  await votingStore.removeVoter(voterAddress.value)
}
async function quickRemove(address) {
  voterAddress.value = address
  await votingStore.removeVoter(address)
  voterAddress.value = ''
}
</script>
<style scoped>
.admin-container { padding: 10px 0; }
/* 统一头部样式 */
.header-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px; border-bottom: 1px solid rgba(100, 255, 218, 0.1); padding-bottom: 20px; }
.main-title { font-family: 'Rajdhani', sans-serif; font-size: 42px; margin: 0; color: #e6f1ff; font-weight: 700; line-height: 1; }
.sub-title { margin-top: 8px; color: #64ffda; font-size: 16px; letter-spacing: 2px; font-weight: 600; }
.mb-15 { margin-bottom: 15px; }
.mb-25 { margin-bottom: 25px; }
.card-top { display: flex; justify-content: space-between; align-items: center; }
/* 优化列表展示 */
.list-item {
  padding: 12px 15px; border-bottom: 1px solid rgba(100, 255, 218, 0.1);
  display: flex; justify-content: flex-start; align-items: center; color: #ccd6f6;
  transition: all 0.3s; border-radius: 4px;
}
.list-item:hover { background: rgba(100, 255, 218, 0.05); }
.item-id {
  color: #64ffda; font-family: 'Orbitron', sans-serif; font-size: 13px;
  margin-right: 15px; background: rgba(100,255,218,0.1); padding: 2px 8px; border-radius: 4px;
}
.item-name { font-weight: bold; font-size: 16px; }
.voter-address {
  font-family: 'Courier New', monospace; background: rgba(100,255,218,0.1);
  padding: 4px 10px; border-radius: 4px; color: #64ffda; font-size: 14px;
  flex-grow: 1; margin-right: 15px;
}
.expire-alert { background: rgba(255, 107, 107, 0.1); border: 1px solid rgba(255, 107, 107, 0.3); color: #ff6b6b; padding: 10px; border-radius: 4px; margin-bottom: 15px; font-size: 14px; }
.info-alert { background: rgba(100, 255, 218, 0.05); border: 1px solid rgba(100, 255, 218, 0.1); color: #8892b0; padding: 10px; border-radius: 4px; font-size: 13px; }
.empty-list { text-align: center; color: #8892b0; padding: 15px 0; font-size: 14px; }
</style>