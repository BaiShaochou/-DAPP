// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title SimpleVoting - 基于区块链的去中心化电子投票系统
 * @author 陈志琛
 * @notice 实现了一个安全、透明的多轮投票系统，支持白名单管理、候选人管理和投票统计
 * @dev 使用防重入保护和阶段控制确保投票过程的安全性
 */
contract SimpleVoting {
    // ========== 防重入保护机制 ==========
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
    address public owner;
    string public voteTitle;
    uint256 public startTime;
    uint256 public endTime;
    uint256 public candidatesCount;
    uint256 public totalVotes;
    uint256 public roundNumber;
    enum Phase { Setup, Voting, Ended }
    Phase public currentPhase;
    struct Candidate {
        uint256 id;
        string name;
        uint256 voteCount;
    }
    struct Round {
        uint256 roundId;
        string title;
        uint256 totalVotes;
        uint256 winnerId;
        bool completed;
        uint256 startTime;
        uint256 endTime;
    }
    mapping(uint256 => Candidate) public candidates;
    mapping(address => bool) public hasVoted;
    mapping(uint256 => Round) public rounds;
    mapping(uint256 => mapping(address => bool)) public roundHasVoted;
    mapping(address => bool) public whitelist;
    event VoteCast(uint256 indexed roundId, uint256 indexed candidateId, address indexed voter, uint256 voteCount);
    event VotingStarted(uint256 indexed roundId, string title, uint256 startTime, uint256 endTime);
    event VotingEnded(uint256 indexed roundId, uint256 winnerId, uint256 totalVotes);
    event CandidateAdded(uint256 indexed candidateId, string name);
    event VoterAdded(address voter);
    event VoterRemoved(address voter);
    event PhaseChanged(Phase newPhase);
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    modifier onlyWhitelisted() {
        require(whitelist[msg.sender], "Not whitelisted");
        _;
    }
    modifier inPhase(Phase _phase) {
        require(currentPhase == _phase, "Invalid phase for this action");
        _;
    }
    constructor() {
        owner = msg.sender; // 设置合约所有者
        currentPhase = Phase.Setup;
        roundNumber = 0;
        _status = _NOT_ENTERED; // 初始化防重入状态为未进入
    }
    
    // ========== 白名单管理 ==========
    /// @notice 添加投票者到白名单
    /// @param _voter 投票者地址
    function addVoter(address _voter) public onlyOwner {
        whitelist[_voter] = true;
        emit VoterAdded(_voter);
    }
    
    /// @notice 从白名单移除投票者
    /// @param _voter 投票者地址
    function removeVoter(address _voter) public onlyOwner {
        whitelist[_voter] = false;
        emit VoterRemoved(_voter);
    }
    
    // ========== 候选人管理 ==========
    /// @notice 添加候选人（仅在Setup阶段）
    /// @param _name 候选人名称
    function addCandidate(string memory _name) public onlyOwner inPhase(Phase.Setup) {
        require(bytes(_name).length > 0, "Name required");
        candidatesCount++;
        candidates[candidatesCount] = Candidate(candidatesCount, _name, 0);
        emit CandidateAdded(candidatesCount, _name);
    }
    
    // ========== 投票轮次控制 ==========
    /// @notice 开始投票轮次
    /// @param _title 投票标题
    /// @param _durationInMinutes 投票持续时间（分钟）
    function startVoting(string memory _title, uint256 _durationInMinutes) public onlyOwner inPhase(Phase.Setup) {
        require(candidatesCount > 0, "No candidates");
        roundNumber++;
        voteTitle = _title;
        startTime = block.timestamp;
        endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        currentPhase = Phase.Voting;
        totalVotes = 0;
        emit VotingStarted(roundNumber, _title, startTime, endTime);
        emit PhaseChanged(Phase.Voting);
    }
    
    /// @notice 结束当前投票轮次
    function endVoting() public onlyOwner inPhase(Phase.Voting) {
        (uint256 winnerId, , ) = getWinner();
        rounds[roundNumber] = Round(roundNumber, voteTitle, totalVotes, winnerId, true, startTime, endTime);
        currentPhase = Phase.Ended;
        emit VotingEnded(roundNumber, winnerId, totalVotes);
        emit PhaseChanged(Phase.Ended);
    }
    
    /// @notice 重置合约以开始新一轮投票
    function resetForNewRound() public onlyOwner inPhase(Phase.Ended) {
        currentPhase = Phase.Setup;
        candidatesCount = 0;
        emit PhaseChanged(Phase.Setup);
    }
    
    // ========== 投票功能 ==========
    /// @notice 执行投票（每个地址每轮只能投一次）
    /// @param _candidateId 候选人ID
    function vote(uint256 _candidateId) public nonReentrant inPhase(Phase.Voting) onlyWhitelisted {
        require(_candidateId > 0 && _candidateId <= candidatesCount, "Invalid candidate ID");
        require(!roundHasVoted[roundNumber][msg.sender], "Already voted in this round");
        require(block.timestamp <= endTime, "Voting time expired");
        roundHasVoted[roundNumber][msg.sender] = true;
        hasVoted[msg.sender] = true;
        candidates[_candidateId].voteCount++;
        totalVotes++;
        emit VoteCast(roundNumber, _candidateId, msg.sender, candidates[_candidateId].voteCount);
    }
    
    // ========== 查询函数 ==========
    /// @notice 获取所有候选人信息
    /// @return ids 候选人ID数组
    /// @return names 候选人名称数组
    /// @return voteCounts 得票数数组
    function getAllCandidates() public view returns (uint256[] memory ids, string[] memory names, uint256[] memory voteCounts) {
        ids = new uint256[](candidatesCount);
        names = new string[](candidatesCount);
        voteCounts = new uint256[](candidatesCount);
        for (uint256 i = 1; i <= candidatesCount; i++) {
            ids[i-1] = candidates[i].id;
            names[i-1] = candidates[i].name;
            voteCounts[i-1] = candidates[i].voteCount;
        }
        return (ids, names, voteCounts);
    }
    
    /// @notice 获取获胜者信息
    /// @return winnerId 获胜者ID
    /// @return winnerName 获胜者名称
    /// @return winnerVotes 获胜者得票数
    function getWinner() public view returns (uint256 winnerId, string memory winnerName, uint256 winnerVotes) {
        require(candidatesCount > 0, "No candidates");
        uint256 maxVotes = 0;
        uint256 winner = 0;
        for (uint256 i = 1; i <= candidatesCount; i++) {
            if (candidates[i].voteCount > maxVotes) {
                maxVotes = candidates[i].voteCount;
                winner = i;
            }
        }
        if (winner == 0) return (0, "No votes", 0);
        return (candidates[winner].id, candidates[winner].name, candidates[winner].voteCount);
    }
    
    /// @notice 获取当前轮次信息
    function getCurrentRound() public view returns (uint256, string memory, Phase, uint256, uint256, uint256, uint256) {
        return (roundNumber, voteTitle, currentPhase, totalVotes, candidatesCount, startTime, endTime);
    }
    
    /// @notice 检查指定地址是否在指定轮次已投票
    /// @param _round 轮次ID
    /// @param _voter 投票者地址
    /// @return 是否已投票
    function checkHasVotedInRound(uint256 _round, address _voter) public view returns (bool) {
        return roundHasVoted[_round][_voter];
    }
}