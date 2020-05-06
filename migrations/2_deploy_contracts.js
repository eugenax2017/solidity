const GpcToken = artifacts.require("GpcToken");
const GpcTokenSale = artifacts.require("GpcTokenSale");

module.exports = function(deployer) {
  deployer.deploy(GpcToken, 5000000).then(() => {
    //Token price is 0.001 Ether
    var tokenPrice = 1000000000000000; //in wei
    return deployer.deploy(GpcTokenSale, GpcToken.address, tokenPrice);
  });  
};
