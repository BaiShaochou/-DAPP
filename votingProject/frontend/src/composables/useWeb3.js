import { ref, computed } from 'vue'
import Web3 from 'web3'

/**
 * Web3 组合函数
 * @author 陈志琛
 * @description 提供钱包连接、账户管理和事件监听功能
 */

// 全局单例状态，避免多处调用状态不同步
const web3 = ref(null)
const account = ref(null)
const chainId = ref(null)
const isConnected = computed(() => !!account.value && !!web3.value)

export function useWeb3() {
    // 初始化Web3实例并设置事件监听
    function initWeb3Instance(provider) {
        web3.value = new Web3(provider)
        provider.on('accountsChanged', (accs) => {
            if (accs.length === 0) {
                web3.value = null
                account.value = null
            } else {
                account.value = accs[0]
            }
            // 账户变化时刷新页面以更新状态
            window.location.reload()
        })
        // 链变化时刷新页面
        provider.on('chainChanged', () => window.location.reload())
    }

    // 连接钱包
    async function connectWallet() {
        if (typeof window.ethereum === 'undefined') {
            throw new Error('请安装 MetaMask 钱包')
        }
        try {
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
            initWeb3Instance(window.ethereum)
            account.value = accounts[0]
            chainId.value = await web3.value.eth.getChainId()
            return true
        } catch (error) {
            web3.value = null
            account.value = null
            throw error
        }
    }
    // 尝试自动连接（恢复之前的连接）
    async function tryAutoConnect() {
        if (typeof window.ethereum === 'undefined') return false
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' })
            if (accounts.length > 0) {
                initWeb3Instance(window.ethereum)
                account.value = accounts[0]
                chainId.value = await web3.value.eth.getChainId()
                return true
            }
            return false
        } catch (err) {
            return false
        }
    }
    return { web3, account, chainId, isConnected, connectWallet, tryAutoConnect }
}