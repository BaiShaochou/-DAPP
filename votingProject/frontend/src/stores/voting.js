import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useWeb3 } from '@/composables/useWeb3'
import { ElMessageBox, ElMessage } from 'element-plus'

/**
 * 投票状态管理 Store
 * @author 陈志琛
 * @description 管理投票系统的核心业务逻辑，包括合约交互、数据加载和投票操作
 */
export const useVotingStore = defineStore('voting', () => {
    const { web3, account } = useWeb3()

    const contract = ref(null)
    const currentPhase = ref(0)
    const candidates = ref([])
    const totalVotes = ref(0)
    const loading = ref(false)
    const isEnsuring = ref(false)
    const roundNumber = ref(0)
    const voteTitle = ref('')
    const winner = ref(null)
    const localDeadline = ref(Number(localStorage.getItem('votingDeadline') || 0)) // 本地存储的投票截止时间戳
    const localVoterList = ref(JSON.parse(localStorage.getItem('localVoterList') || '[]')) // 本地缓存的白名单列表
    let pollingTimer = null // 数据轮询定时器

    // 获取合约ABI
    let contractAbi = null
    async function fetchAbi() {
        if (contractAbi) return
        try {
            const response = await fetch('/contracts/SimpleVoting.json')
            const data = await response.json()
            contractAbi = data.abi
        } catch (error) {
            console.error('无法加载合约 ABI', error)
            ElMessage.error('找不到合约编译文件')
            throw error
        }
    }

    // 初始化合约实例
    async function initContract(address) {
        if(!web3.value) throw new Error("Web3 未初始化")
        await fetchAbi()
        contract.value = new web3.value.eth.Contract(contractAbi, address)
    }

    // 确保合约已连接，如未连接则提示用户输入合约地址
    async function ensureContract() {
        if (isEnsuring.value) return
        if (!window.ethereum || !web3.value || !account.value) {
            ElMessage.error('Web3 未初始化，请先连接钱包')
            return
        }
        if (contract.value) return

        isEnsuring.value = true
        let address = localStorage.getItem('votingContractAddress')

        if (!address) {
            try {
                const { value } = await ElMessageBox.prompt(
                    '请输入部署的投票合约地址',
                    '配置合约地址',
                    {
                        confirmButtonText: '确认连接',
                        cancelButtonText: '取消',
                        inputPattern: /^0x[a-fA-F0-9]{40}$/,
                        inputErrorMessage: '请输入有效的以太坊地址'
                    }
                )
                address = value
                localStorage.setItem('votingContractAddress', address)
            } catch (error) {
                isEnsuring.value = false
                return
            }
        }

        try {
            await initContract(address)
            await loadVotingData()
            startPolling() // 初始化成功后开启数据轮询
        } catch (err) {
            localStorage.removeItem('votingContractAddress')
            contract.value = null
            ElMessage.error('合约加载失败，请检查地址或网络')
            console.error(err)
        } finally {
            isEnsuring.value = false
        }
    }

    // 加载投票数据（候选项、阶段、票数等）
    async function loadVotingData() {
        if (!contract.value) return
        loading.value = true
        try {
            const roundInfo = await contract.value.methods.getCurrentRound().call()
            roundNumber.value = Number(roundInfo[0])
            voteTitle.value = roundInfo[1]
            currentPhase.value = Number(roundInfo[2])
            totalVotes.value = Number(roundInfo[3])


            const cands = await contract.value.methods.getAllCandidates().call()
            candidates.value = cands[0].map((id, index) => ({
                id: Number(id),
                name: cands[1][index],
                voteCount: Number(cands[2][index])
            }))

            if (currentPhase.value === 2) {
                const winData = await contract.value.methods.getWinner().call()
                winner.value = { id: Number(winData[0]), name: winData[1], votes: Number(winData[2]) }
            } else {
                winner.value = null
            }
        } catch (err) {
            console.error('加载失败:', err)
        } finally {
            loading.value = false
        }
    }

    // ========== 数据轮询机制 ==========
    // 启动轮询，每12秒自动刷新数据
    function startPolling() {
        pollingTimer = setInterval(async () => {
            if (contract.value) {
                await loadVotingData()
            }
        }, 12000)
    }

    // 停止轮询
    function stopPolling() {
        if (pollingTimer) {
            clearInterval(pollingTimer)
            pollingTimer = null
        }
    }

    // 获取Gas配置
    async function getGasOptions() {
        try {
            const gasPrice = await web3.value.eth.getGasPrice()
            return { from: account.value, gasPrice: gasPrice }
        } catch (e) {
            return { from: account.value }
        }
    }

    // 添加候选人
    async function addCandidate(name) {
        if (!contract.value) return ElMessage.error('合约未连接')
        loading.value = true
        try {
            const options = await getGasOptions()
            await contract.value.methods.addCandidate(name).send(options)
            ElMessage.success('添加成功')
            await loadVotingData()
        } catch (err) {
            ElMessage.error('添加失败: ' + err.message)
        } finally {
            loading.value = false
        }
    }

    // 开始投票，设置标题和持续时间
    async function startVoting(title, durationMinutes) {
        if (!contract.value) return ElMessage.error('合约未连接')
        loading.value = true
        try {
            const options = await getGasOptions()
            await contract.value.methods.startVoting(title, durationMinutes).send(options)
            ElMessage.success('投票已开启！')

            // 本地记录截止时间戳
            const deadline = Math.floor(Date.now() / 1000) + Number(durationMinutes) * 60
            localDeadline.value = deadline
            localStorage.setItem('votingDeadline', String(deadline))

            await loadVotingData()
        } catch (err) {
            ElMessage.error('开启失败: ' + err.message)
        } finally {
            loading.value = false
        }
    }

    // 结束投票
    async function endVoting() {
        if (!contract.value) return ElMessage.error('合约未连接')
        loading.value = true
        try {
            const options = await getGasOptions()
            await contract.value.methods.endVoting().send(options)
            ElMessage.success('投票已结束！')
            await loadVotingData()
        } catch (err) {
            ElMessage.error('结束失败: ' + err.message)
        } finally {
            loading.value = false
        }
    }

    // 重置轮次，准备下一轮投票
    async function resetRound() {
        if (!contract.value) return ElMessage.error('合约未连接')
        loading.value = true
        try {
            const options = await getGasOptions()
            await contract.value.methods.resetForNewRound().send(options)
            ElMessage.success('已重置，可开启新一轮！')

            // 清空本地倒计时和白名单缓存
            localDeadline.value = 0
            localStorage.removeItem('votingDeadline')

            localVoterList.value = []
            localStorage.setItem('localVoterList', JSON.stringify(localVoterList.value))
            await loadVotingData()
        } catch (err) {
            ElMessage.error('重置失败: ' + err.message)
        } finally {
            loading.value = false
        }
    }

    // 执行投票
    async function castVote(candidateId) {
        if (!contract.value) throw new Error('合约未连接')
        loading.value = true
        try {
            const options = await getGasOptions()
            await contract.value.methods.vote(candidateId).send(options)
            ElMessage.success('投票成功！')
            await loadVotingData()
        } catch (err) {
            throw err
        } finally {
            loading.value = false
        }
    }

    // 保存白名单到本地缓存
    function saveLocalVoter(address) {
        if (!localVoterList.value.includes(address)) {
            localVoterList.value.push(address)
            localStorage.setItem('localVoterList', JSON.stringify(localVoterList.value))
        }
    }

    // 从本地缓存移除白名单
    function removeLocalVoter(address) {
        localVoterList.value = localVoterList.value.filter(v => v !== address)
        localStorage.setItem('localVoterList', JSON.stringify(localVoterList.value))
    }

    // 添加投票者到白名单
    async function addVoter(address) {
        if (!contract.value) return ElMessage.error('合约未连接')
        if (localVoterList.value.includes(address)) {
            return ElMessage.warning('本地记录显示该地址已在白名单中，无需重复添加')
        }
        loading.value = true
        try {
            const options = await getGasOptions()
            await contract.value.methods.addVoter(address).send(options)
            ElMessage.success('添加白名单成功')
            saveLocalVoter(address)
        } catch (err) {
            if (err.message.includes("revert") || err.message.includes("Already")) {
                ElMessage.error('添加失败：该地址可能在链上已存在')
                saveLocalVoter(address)
            } else {
                ElMessage.error('操作失败: ' + err.message)
            }
        } finally {
            loading.value = false
        }
    }

    // 从白名单移除投票者
    async function removeVoter(address) {
        if (!contract.value) return ElMessage.error('合约未连接')
        loading.value = true
        try {
            const options = await getGasOptions()
            await contract.value.methods.removeVoter(address).send(options)
            ElMessage.success('移除白名单成功')
            removeLocalVoter(address)
        } catch (err) {
            if (err.message.includes("revert") || err.message.includes("Not")) {
                ElMessage.error('移除失败：该地址可能不在链上白名单中')
                removeLocalVoter(address)
            } else {
                ElMessage.error('操作失败: ' + err.message)
            }
        } finally {
            loading.value = false
        }
    }

    return {
        contract, currentPhase, candidates, totalVotes, loading, roundNumber, voteTitle, winner,
        localDeadline, localVoterList, startPolling, stopPolling,
        ensureContract, loadVotingData, addCandidate, startVoting, endVoting, resetRound, castVote, addVoter, removeVoter
    }
})