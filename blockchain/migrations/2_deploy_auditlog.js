const AuditLog = artifacts.require("AuditLog");

module.exports = function (deployer) {
  deployer.deploy(AuditLog);
};
