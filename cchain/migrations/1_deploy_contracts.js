/**
 * Migration: Deploy FileRegistry Contract
 */

const FileRegistry = artifacts.require("FileRegistry");

module.exports = function (deployer) {
  deployer.deploy(FileRegistry);
};
