var GpcTokenSale = artifacts.require("./GpcTokenSale.sol");
var GpcToken = artifacts.require("./GpcToken.sol");

contract('GpcTokenSale', (accounts) => {
    var tokenSaleInstance;
    var admin = accounts[0];
    var buyer = accounts[1];
    var tokenPrice = 1000000000000000; //in wei    
    var tokenAvailable = 750000;
    var numberOfTokens;

    it('initializes the contract with the correct values', () => {
        return GpcTokenSale.deployed().then((instance) => {
            tokenSaleInstance = instance;
            return tokenSaleInstance.address;
        }).then((address) => {
            assert.notEqual(address, 0x0, 'has contract address');
            return tokenSaleInstance.tokenContract();            
        }).then((address) => {
            assert.notEqual(address, 0x0, 'has token contract address');
            return tokenSaleInstance.tokenPrice();                        
        }).then((price) => {
            assert.equal(price, tokenPrice, 'token price is correct');
        });
    });

    it('facilitates token buying', () => {
        return GpcToken.deployed().then((instance) => {
            //Grab token instance first
            tokenInstance = instance;            
            return GpcTokenSale.deployed();
        }).then((instance) => {
            //Then grab token sale instance
            tokenSaleInstance = instance;
            //Provision 750000 of totalSupply
            return tokenInstance.transfer(tokenSaleInstance.address, tokenAvailable, { from: admin});
        }).then((receipt) => {
            numberOfTokens = 10;   
            return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then((receipt) => {
            assert.equal(receipt.logs.length, 1, 'triggers one event');
            assert.equal(receipt.logs[0].event, 'Sell', 'should be the "Sell" event');
            assert.equal(receipt.logs[0].args._buyer, buyer, 'logs the account that purchased tokens');
            assert.equal(receipt.logs[0].args._amount, numberOfTokens, 'logs the number of purchased');
            return tokenSaleInstance.tokensSold();
        }).then((amount) => {
            assert.equal(amount.toNumber(), numberOfTokens, 'increments the number of tokens sold');
            return tokenInstance.balanceOf(buyer);
        }).then((balance) => {    
            return tokenInstance.balanceOf(tokenSaleInstance.address);
        }).then((balance) => {
            assert.equal(balance.toNumber(), tokenAvailable - numberOfTokens);
            //Try to buy tokens different from the ether value
             return tokenSaleInstance.buyTokens(numberOfTokens, { from: buyer, value: 1 });
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, 'msg.value must equal number of tokens in wei');
            return tokenSaleInstance.buyTokens(800000, { from: buyer, value: numberOfTokens * tokenPrice });
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, 'cannot purchase more than available');
        });    
    });

    it('ends token sale', function() {
        return GpcToken.deployed().then((instance) => {            
            tokenInstance = instance;
            return GpcTokenSale.deployed();
        }).then((instance) => {
            //Then grab token sale instance
            tokenSaleInstance = instance;
            //Try to end sale from account other than admin
            return tokenSaleInstance.endSale({ from: buyer });
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf('revert') >= 0, 'must be admin to end sale');
            return tokenSaleInstance.endSale({ from: admin });             
        }).then((receipt) => {
            return tokenInstance.balanceOf(admin);
        }).then((balance) => {
            assert.equal(balance.toNumber(), 4999990, 'returns all unsold tokens to admin');
            //Check that token price was reset when selfDestruct was called
            return tokenSaleInstance.tokenPrice();
        }).then((price) => {
            assert.equal(price.toNumber(), 0, 'token price was reset');
        }).then(assert.fail).catch((error) => {
            assert(error.message.indexOf('Gas') >= 0, 'token price was reset');
        });
    });

});