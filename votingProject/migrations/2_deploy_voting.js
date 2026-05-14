/**
 * 合约部署脚本
 * @author 陈志琛
 * @description 部署SimpleVoting合约并初始化管理员账户
 */
const SimpleVoting = artifacts.require("SimpleVoting");

module.exports = function (deployer, network, accounts) {
    deployer.deploy(SimpleVoting).then(async function(instance) {
        console.log("SimpleVoting 合约部署成功!");
        console.log("合约地址:", instance.address);
        
        // 添加默认管理员账户到白名单
        await instance.addVoter(accounts[0]);
        console.log("已将部署者账户加入白名单:", accounts[0]);
    });
};