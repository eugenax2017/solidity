App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    loading: false,
    tokenPrice: 1000000000000000,
    tokensSold: 0,
    tokensAvailable: 750000,

    init: function() {
        console.log("App initialized...");
        return App.initWeb3();
    },

    initWeb3: function() {
        
        if (typeof ethereum !== 'undefined') {
            //getting Permission to access. This is for when the user has new MetaMask
            ethereum.enable();
            App.web3Provider = ethereum;
            web3 = new Web3(ethereum);          
        } else if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;  
            web3 = new Web3(web3.currentProvider);
            // Acccounts always exposed. This is those who have old version of MetaMask
          
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
          
        }
        /*-f (typeof web3 !== 'underfined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }*/
        
        return App.initContracts();
    },

    initContracts: function() {
        $.getJSON("GpcTokenSale.json", function(gpcTokenSale) {
            App.contracts.GpcTokenSale = TruffleContract(gpcTokenSale);
            App.contracts.GpcTokenSale.setProvider(App.web3Provider);
            App.contracts.GpcTokenSale.deployed().then((gpcTokenSale) => {
                console.log("Gpc Token Sale Address: ", gpcTokenSale.address);
            });
        }).done(() => {
            $.getJSON("GpcToken.json", function(gpcToken) {
                App.contracts.GpcToken = TruffleContract(gpcToken);
                App.contracts.GpcToken.setProvider(App.web3Provider);
                App.contracts.GpcToken.deployed().then((gpcToken) => {
                    console.log("Gpc Token Address: ", gpcToken.address);
                });
                App.listenForEvents();
                return App.render();
            });
        });
    },

    //Listen for events emitted from the  contract
    listenForEvents: function() {
        /*App.contracts.GpcTokenSale.deployed().then((instance) => {
            instance.Sell({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).then((error, event) => {
                console.log("event triggered", event);
                App.render();
            });
        });*/
        App.contracts.GpcTokenSale.deployed().then((instance) => {            
            instance.Sell( {
                fromBlock: 0,
                toBlock: 'latest'
            }, (error, event) => {
                console.log("event triggered", event);
                App.render();
            });
        });
    },

    render: function() {
        if (App.loading) {
            return;
        }
        App.loading = true;

        var loader = $('#loader');
        var content = $('#content');

        loader.show();
        content.hide();

        //Load account data
        web3.eth.getCoinbase((err, account) => {
            if(err === null) {
                console.log("account", account);
                App.account = account;
                $('#accountAddress').html("Your Account: " + account);
            }            
        });

        //Load token sale contract
        App.contracts.GpcTokenSale.deployed().then((instance) => {
            gpcTokenSaleInstance = instance;
            return gpcTokenSaleInstance.tokenPrice();
        }).then((tokenPrice) => {
            App.tokenPrice = tokenPrice;            
            $('.token-price').html(web3.utils.fromWei(App.tokenPrice, "ether"));
            return gpcTokenSaleInstance.tokensSold();
        }).then((tokensSold) => {       
            App.tokensSold = tokensSold.toNumber();       
            //App.tokensSold = 750000;     
            $('.tokens-sold').html(App.tokensSold);
            $('.tokens-available').html(App.tokensAvailable);

            var progressPercent = Math.ceil(App.tokensSold / App.tokensAvailable*100);
            $('#progress').css('width', progressPercent + '%');

            //Load token contract
            App.contracts.GpcToken.deployed().then((instance) => {
                gpcTokenInstance = instance;
                return gpcTokenInstance.balanceOf(App.account);
            }).then((balance) => {
                $('.gpc-balance').html(balance.toNumber());
                App.loading = false;
                loader.hide();
                content.show();
            });
        });       
    },

    buyTokens: function() {
        //$('#content').hide();
        //$('#loader').show();
        alert("Pushed the button");
        var numberOfTokens = $('#numberOfTokens').val();
        App.contracts.GpcTokenSale.deployed().then((instance) => {
            return instance.buyTokens(numberOfTokens, {
                from: App.account,
                value: numberOfTokens * App.tokenPrice,
                gas: 500000 //Gas limit 
            });
        }).then((result) => {
            console.log("Tokens bought ...");
            $('form').trigger('reset'); //reset number of tokens in form
            /*$('#loader').hide();
            $('#content').show();*/
            //Waiting for Sell event
        });
    }
}    

$(function() {
    console.log("Enter in the app ");
    alert("ethereum: " + ethereum);
    $(window).on('load', function() {
        App.init();
    })
});