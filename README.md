# 基于区块链的DApp电子投票系统

## 项目简介

这是一个基于以太坊区块链的去中心化电子投票系统（DApp），旨在提供安全、透明、不可篡改的投票解决方案。系统采用智能合约技术，确保投票过程的公正性和数据的真实性，支持多轮投票、白名单管理和实时结果统计。
并且显然我并没有上传node_modules，这个家伙太麻烦了。

**作者：BaiShaochou**

## 核心特性

-  **去中心化信任**：基于以太坊智能合约，数据公开透明，不可篡改
-  **安全防护**：内置防重入攻击保护，确保投票过程安全
-  **白名单机制**：只有授权地址才能参与投票，防止恶意刷票
-  **多轮投票支持**：支持多轮次投票管理，每轮独立统计
-  **实时统计**：实时显示投票进度和候选人得票情况
-  **现代化界面**：基于 Vue 3 + Element Plus 构建的响应式用户界面
-  **高性能**：使用 Vite 构建工具，提供快速的开发体验

## 技术栈

### 智能合约层
- **Solidity** ^0.8.19 - 智能合约编程语言
- **Truffle** ^5.11.5 - 以太坊开发框架
- **OpenZeppelin Contracts** ^4.9.6 - 安全合约库

### 前端应用层
- **Vue 3** ^3.5.32 - 渐进式 JavaScript 框架
- **Vite** ^8.0.10 - 下一代前端构建工具
- **Element Plus** ^2.13.7 - Vue 3 UI 组件库
- **Pinia** ^3.0.4 - Vue 状态管理
- **Vue Router** ^4.6.4 - 官方路由管理器
- **Web3.js** ^4.16.0 - 以太坊 JavaScript API
- **ECharts** ^6.0.0 - 数据可视化图表库
- **Day.js** ^1.11.20 - 轻量级日期处理库
- **Sass** ^1.99.0 - CSS 预处理器

## 项目结构

```
votingProject/
├── contracts/                  # 智能合约目录
│   └── SimpleVoting.sol       # 核心投票合约
├── frontend/                   # 前端应用目录
│   ├── public/
│   │   └── contracts/         # 合约 ABI 文件
│   ├── src/
│   │   ├── components/        # Vue 组件
│   │   ├── composables/       # 组合式 API
│   │   ├── router/            # 路由配置
│   │   ├── stores/            # Pinia 状态管理
│   │   ├── views/             # 页面视图
│   │   ├── App.vue            # 根组件
│   │   └── main.js            # 入口文件
│   └── package.json
├── migrations/                 # 部署脚本
│   └── 2_deploy_voting.js
├── test/                       # 测试文件
├── truffle-config.js          # Truffle 配置文件
└── package.json               # 项目依赖配置
```

## 快速开始

### 环境要求

- Node.js >= 16.x
- npm >= 8.x
- Ganache 或其他以太坊本地测试网络

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd votingProject
```

2. **安装后端依赖**
```bash
npm install
```

3. **安装前端依赖**
```bash
cd frontend
npm install
cd ..
```

4. **启动本地区块链网络**
   
   使用 Ganache 创建本地以太坊测试网络，默认端口为 7545。

5. **编译智能合约**
```bash
npm run compile
```

6. **部署合约到本地网络**
```bash
npm run migrate
```

7. **启动前端开发服务器**
```bash
npm start
```

前端应用将在 `http://localhost:5173` 启动（具体端口以 Vite 输出为准）。

## 使用说明

### 管理员操作

1. **添加候选人**：在 Setup 阶段添加投票候选人
2. **管理白名单**：添加或移除有投票权的地址
3. **开始投票**：设置投票标题和持续时间，启动投票轮次
4. **结束投票**：手动结束当前投票轮次
5. **重置系统**：结束后重置以开始新一轮投票

### 投票者操作

1. **连接钱包**：使用 MetaMask 或其他 Web3 钱包连接应用
2. **查看候选人**：浏览当前投票轮次的候选人信息
3. **执行投票**：选择心仪的候选人进行投票（每轮限投一次）
4. **查看结果**：实时查看投票统计和获胜者信息

## 智能合约功能

### 核心合约：SimpleVoting

#### 主要功能模块

- **防重入保护**：使用状态变量防止重入攻击
- **阶段控制**：Setup（设置）、Voting（投票）、Ended（结束）三阶段管理
- **白名单管理**：`addVoter()`、`removeVoter()`
- **候选人管理**：`addCandidate()`
- **投票控制**：`startVoting()`、`endVoting()`、`vote()`
- **结果查询**：`getWinner()`、`getAllCandidates()`、`getCurrentRound()`

#### 关键事件

- `VoteCast`：投票完成事件
- `VotingStarted`：投票开始事件
- `VotingEnded`：投票结束事件
- `CandidateAdded`：候选人添加事件
- `VoterAdded/VoterRemoved`：白名单变更事件

## 开发指南

### 常用命令

```bash
# 编译合约
npm run compile

# 部署合约（自动复制 ABI 到前端）
npm run migrate

# 启动前端开发服务器
npm start

# 构建前端生产版本
npm run build
```

### 修改合约后重新部署

1. 修改 `contracts/SimpleVoting.sol`
2. 运行 `npm run migrate` 重新编译和部署
3. ABI 文件会自动复制到 `frontend/public/contracts/`
4. 刷新前端页面即可使用新合约

## 安全考虑

- ✅ 使用防重入修饰器保护关键函数
- ✅ 访问控制：仅合约所有者可执行管理操作
- ✅ 阶段验证：确保操作在正确的阶段执行
- ✅ 白名单机制：限制投票参与者
- ✅ 每轮单次投票：防止重复投票
- ✅ 时间戳检查：确保投票在有效期内

## 注意事项

- 本系统仅用于毕业设计和演示目的
- 生产环境部署前需要进行全面的安全审计
- 建议使用经过审计的 OpenZeppelin 合约库增强安全性
- 主网部署需要配置相应的网络参数和 Gas 策略


## 吐槽

还得整毕业设计，真的好麻烦啊，幸好有一些ai工具可以使用

---

**作者：BaiShaochou**  
**版本：1.0.0**
