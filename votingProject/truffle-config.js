/**
 * Truffle 配置文件
 * @author 陈志琛
 * @description 配置区块链网络、编译器和合约输出目录
 */
module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: { enabled: true, runs: 200 }
      }
    }
  },
  // 合约构建输出目录，供前端使用
  contracts_build_directory: "./frontend/public/contracts/"
};