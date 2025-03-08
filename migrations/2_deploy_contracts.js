const Coinflip = artifacts.require("Coinflip");
const Ownable = artifacts.require("Ownable");

module.exports = function (deployer) {
  //deployer.deploy(Ownable);
  deployer.deploy(Coinflip);
};
