<template>
  <div class="voting-container">
    <!-- 投票大厅头部 -->
    <div class="header-section">
      <div class="header-left">
        <h2 class="main-title">{{ votingStore.voteTitle || 'DAPP电子投票系统' }}</h2>
        <div class="sub-title">第 {{ votingStore.roundNumber }} 轮 | {{ phaseText }}</div>
      </div>
      <div class="header-right">
<!--        <el-button type="primary" @click="$router.push('/app/admin')">-->
<!--          前往管理后台 ➜-->
<!--        </el-button>-->
      </div>
    </div>
    <!-- 倒计时组件 -->
    <div v-if="currentPhase === 1 && votingStore.localDeadline > 0" class="countdown-card">
      <div class="countdown-wrapper">
        <div class="countdown-label">⏰ VOTING REMAINING</div>
        <div class="countdown-time">{{ countdownText }}</div>
      </div>
      <el-progress
          :percentage="timeProgress"
          :stroke-width="6"
          :color="timeProgress > 80 ? '#ff6b6b' : '#64ffda'"
          :show-text="false"
          style="margin-top: 15px;"
      />
    </div>
    <!-- 投票已结束 -->
    <div v-if="currentPhase === 2 && winner" class="winner-card">
      <div class="winner-crown">♛</div>
      <h1 class="winner-name">{{ winner.name }}</h1>
      <p class="winner-votes">得票数: {{ winner.votes }} 票 (总票数: {{ votingStore.totalVotes }})</p>
    </div>
    <el-row :gutter="25">
      <el-col :span="16">
        <div v-if="currentPhase === 0" class="empty-state">
          <div class="empty-icon">⏳</div>
          <h3>投票尚未开始</h3>
          <p>管理员正在添加候选人，请耐心等待开启。</p>
        </div>
        <div v-else>
          <div v-for="c in votingStore.candidates" :key="c.id" class="candidate-card">
            <div class="card-top">
              <h3 class="candidate-name">❖ {{ c.name }}</h3>
              <div class="tag-group">
                <el-tag v-if="currentPhase === 2 && winner && c.id === winner.id" type="danger" effect="dark">WINNER</el-tag>
                <el-tag type="info">{{ c.voteCount }} 票</el-tag>
              </div>
            </div>
            <el-progress
                :percentage="votingStore.totalVotes > 0 ? parseFloat((c.voteCount / votingStore.totalVotes * 100).toFixed(1)) : 0"
                :color="getBarItemColor(c, currentPhase === 2 && winner && c.id === winner.id)"
                :stroke-width="14"
                :text-inside="true"
            />
            <div class="card-bottom">
              <span class="percent-text">占比: {{ votingStore.totalVotes > 0 ? (c.voteCount / votingStore.totalVotes * 100).toFixed(1) : 0 }}%</span>
              <el-button
                  v-if="currentPhase === 1"
                  type="primary"
                  size="large"
                  @click="handleVote(c.id)"
                  :loading="votingLoading"
                  class="vote-btn"
              >
                投TA一票
              </el-button>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="8">
        <el-card shadow="never" class="chart-card">
          <template #header>
            <div class="card-top">
              <strong>📊 投票分布</strong>
              <el-tag type="info" size="small" v-if="currentPhase === 1">实时更新中</el-tag>
            </div>
          </template>
          <div v-if="votingStore.candidates.length > 0 && votingStore.totalVotes > 0" ref="chartRef" style="height: 300px;"></div>
          <div v-else class="chart-empty">暂无投票数据</div>
        </el-card>
        <el-card shadow="never" style="margin-top: 20px;">
          <h4 style="color: #64ffda; margin-top:0;">投票统计</h4>
          <div class="stat-item"><span>总票数</span> <strong>{{ votingStore.totalVotes }}</strong></div>
          <div class="stat-item"><span>候选项</span> <strong>{{ votingStore.candidates.length }}</strong></div>
          <el-divider style="border-color: rgba(100,255,218,0.1);" />
          <div class="stat-item"><span>您的身份</span> <strong>{{ account ? account.slice(0,6) + '...' + account.slice(-4) : '未连接' }}</strong></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>
<script setup>
/**
 * 投票大厅视图组件
 * @author 陈志琛
 * @description 展示候选人列表、投票功能和实时统计图表
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useVotingStore } from '@/stores/voting'
import { useWeb3 } from '@/composables/useWeb3'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const votingStore = useVotingStore()
const { account } = useWeb3()
const votingLoading = ref(false)
const chartRef = ref(null)
let chartInstance = null

// 计算属性：当前阶段、获胜者、阶段文本
const currentPhase = computed(() => votingStore.currentPhase)
const winner = computed(() => votingStore.winner)
const phaseText = computed(() => {
  const phases = { 0: '准备阶段', 1: '投票进行中', 2: '投票已结束' }
  return phases[currentPhase.value] || '未知'
})
// 颜色调色板 - 用于图表和进度条的多色显示
const colorPalette = ['#64ffda', '#00adb5', '#e6a23c', '#a855f7', '#3b82f6', '#ff6b6b']

// 获取进度条颜色
function getBarItemColor(candidate, isWinner) {
  if (isWinner) return '#ff6b6b'
  const index = votingStore.candidates.findIndex(c => c.id === candidate.id)
  return colorPalette[index % colorPalette.length]
}
// ========== 倒计时逻辑 ==========
const countdownText = ref('计算中...')
const timeProgress = ref(0)
let countdownTimer = null

// 启动倒计时
function startCountdown() {
  stopCountdown()
  const updateCountdown = () => {
    const deadline = votingStore.localDeadline
    if (!deadline || currentPhase.value !== 1) {
      countdownText.value = '未设置或已结束'
      timeProgress.value = 0
      return
    }
    const now = Math.floor(Date.now() / 1000)
    const remaining = deadline - now
    if (remaining <= 0) {
      countdownText.value = '00:00:00 [EXPIRED]'
      timeProgress.value = 100
      return
    }
    const hours = Math.floor(remaining / 3600)
    const minutes = Math.floor((remaining % 3600) / 60)
    const seconds = remaining % 60
    countdownText.value = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    timeProgress.value = 100 - (remaining / 600 * 100)
  }
  updateCountdown()
  countdownTimer = setInterval(updateCountdown, 1000)
}
function stopCountdown() {
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null }
}
// ========== ECharts 图表逻辑 ==========
// 初始化图表
function initChart() {
  if (chartRef.value && !chartInstance) {
    chartInstance = echarts.init(chartRef.value, 'dark')
    chartInstance.setOption({ backgroundColor: 'transparent' })
  }
}
function updateChart() {
  if (votingStore.candidates.length === 0 || votingStore.totalVotes === 0) {
    if (chartInstance) chartInstance.clear()
    return
  }
  if (chartRef.value && !chartInstance) initChart()
  if (!chartInstance) return
  const isFinished = currentPhase.value === 2
  const winnerName = winner.value?.name
  const data = votingStore.candidates.map((c, index) => ({
    name: c.name,
    value: c.voteCount,
    itemStyle: {
      // 投票结束时，获胜者显示红色，其他候选项变灰；投票进行中则按多色盘分配
      color: isFinished ? (c.name === winnerName ? '#ff6b6b' : '#4a5568') : colorPalette[index % colorPalette.length],
      opacity: isFinished && c.name !== winnerName ? 0.5 : 1
    }
  }))
  const option = {
    tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c}票 ({d}%)' },
    legend: {
      orient: 'vertical', left: 'left', top: 'middle',
      textStyle: { fontSize: 12, color: '#ccd6f6' }
    },
    series: [{
      name: '得票分布', type: 'pie', radius: ['45%', '75%'], center: ['60%', '50%'],
      itemStyle: { borderColor: '#112240', borderWidth: 3 },
      label: { color: '#ccd6f6', formatter: '{b}\n{d}%' },
      emphasis: { label: { fontSize: 16, fontWeight: 'bold', color: '#fff' } },
      data: data
    }]
  }
  chartInstance.setOption(option, true)
  chartInstance.resize()
}
async function handleVote(id) {
  votingLoading.value = true
  try {
    await votingStore.castVote(id)
    ElMessage.success('投票成功！')
  } catch (err) {
    ElMessage.error('投票失败: ' + (err.reason || err.message))
  } finally {
    votingLoading.value = false
  }
}
onMounted(async () => {
  if (votingStore.contract) await votingStore.loadVotingData()
  else await votingStore.ensureContract()
  startCountdown()
  await nextTick()
  initChart()
  updateChart()
})
onUnmounted(() => {
  stopCountdown()
  if (chartInstance) { chartInstance.dispose(); chartInstance = null }
})
watch([() => votingStore.candidates, () => votingStore.totalVotes, currentPhase], async () => {
  await nextTick()
  updateChart()
  if (currentPhase.value === 1) startCountdown()
}, { deep: true })
window.addEventListener('resize', () => { if (chartInstance) chartInstance.resize() })
</script>
<style scoped>
.voting-container { padding: 10px 0; }
/* 标题区域样式 */
.header-section {
  display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 30px;
  border-bottom: 1px solid rgba(100, 255, 218, 0.1); padding-bottom: 20px;
}
.main-title {
  font-family: 'Rajdhani', sans-serif; font-size: 42px; margin: 0; color: #e6f1ff;
  font-weight: 700; line-height: 1;
}
.sub-title {
  margin-top: 8px; color: #64ffda; font-size: 16px; letter-spacing: 2px; font-weight: 600;
}
.countdown-card {
  padding: 20px 30px; border-radius: 8px; margin-bottom: 25px;
  background: rgba(100, 255, 218, 0.05); border: 1px solid rgba(100, 255, 218, 0.2);
}
.countdown-wrapper { display: flex; justify-content: space-between; align-items: center; }
.countdown-label { font-size: 14px; color: #8892b0; letter-spacing: 1px; }
.countdown-time {
  font-family: 'Orbitron', sans-serif; font-size: 32px; font-weight: bold;
  color: #64ffda; text-shadow: 0 0 15px rgba(100, 255, 218, 0.6);
}
.winner-card {
  text-align: center; margin-bottom: 25px; padding: 30px;
  background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(100, 255, 218, 0.1) 100%);
  border: 1px solid #ff6b6b; border-radius: 8px;
}
.winner-crown { font-size: 40px; color: #e6a23c; margin-bottom: 10px; }
.winner-name { color: #64ffda; margin: 10px 0; font-family: 'Orbitron', sans-serif; text-shadow: 0 0 10px rgba(100,255,218,0.5);}
.winner-votes { color: #ccd6f6; }
.candidate-card {
  padding: 20px 25px; border: 1px solid rgba(100, 255, 218, 0.15);
  border-radius: 8px; margin-bottom: 15px; background: rgba(17, 34, 64, 0.6);
  transition: all 0.3s; position: relative; overflow: hidden;
}
.candidate-card::before {
  content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
  background: #64ffda; opacity: 0; transition: opacity 0.3s;
}
.candidate-card:hover { border-color: #64ffda; box-shadow: 0 0 20px rgba(100, 255, 218, 0.1); }
.candidate-card:hover::before { opacity: 1; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.candidate-name {
  margin: 0;
  font-size: 20px;
  font-weight: bold;
  color: #e6f1ff;
  background: linear-gradient(90deg, rgba(100, 255, 218, 0.15) 0%, transparent 100%);
  padding: 6px 15px;
  border-left: 4px solid #64ffda;
  border-radius: 0 4px 4px 0;
  display: inline-block;
  letter-spacing: 1px;
}
.tag-group { display: flex; gap: 10px; }
.card-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 15px; }
.percent-text { color: #8892b0; font-size: 14px; }
.chart-card { border-radius: 8px !important; }
.chart-empty { text-align: center; color: #8892b0; padding: 40px 0; }
.stat-item { display: flex; justify-content: space-between; margin-bottom: 10px; color: #8892b0; }
.stat-item strong { color: #e6f1ff; }
.empty-state { text-align: center; padding: 80px 0; color: #8892b0; }
.empty-icon { font-size: 50px; margin-bottom: 20px; }
</style>