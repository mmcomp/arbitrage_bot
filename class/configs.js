const mysql = require('mysql');

class Configs {
    constructor(){
        this.con = mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
    }

    async load() {
        var that = this;
        return new Promise(function(resolve, reject) {
            that.con.connect(function(err) {
                if (err) reject(err);
                // console.log("Connected!");
                that.con.query('SELECT * FROM `configs`', function (err, result) {
                  if (err) reject(err);
                //   console.log("Result: " + result);
                  resolve(result);
                });
            });
        });          
    }

    async getConfigs() {
        let configs = {
            min_price_diff: 1,
            max_price_diff: 999999999,
            min_sale_price_diff: 1,
            max_sale_price_diff: 999999999,
            min_request : 1,
            max_request : 999999999,
            enable_main_bot: false,
            firstGroupChatId: -1001437213215,
            secondGroupChatId: -1001437213215,
            thirdGroupChatId: -1001437213215
          }
        try {
            const rawData = await this.load();
            for(var data of rawData) {
                if(data.mkey == 'arbitrage_firstgroup_id') {
                    configs.firstGroupChatId = data.mvalue;
                }else if(data.mkey == 'arbitrage_secondgroup_id') {
                    configs.secondGroupChatId = data.mvalue;
                }else if(data.mkey == 'arbitrage_firstgroup_id') {
                    configs.thirdGroupChatId = data.mvalue;
                }else if(data.mkey == 'arbitrage_enable') {
                    configs.enable_main_bot = (data.mvalue=='true');
                }else if(data.mkey == 'arbitrage_min_request') {
                    configs.min_request = parseInt(data.mvalue, 10);
                }else if(data.mkey == 'arbitrage_max_request') {
                    configs.max_request = parseInt(data.mvalue, 10);
                }else if(data.mkey == 'arbitrage_min_price_diff') {
                    configs.min_price_diff = parseInt(data.mvalue, 10);
                }else if(data.mkey == 'arbitrage_max_price_diff') {
                    configs.max_price_diff = parseInt(data.mvalue, 10);
                }
            }
        } catch(e) {
            console.log(e)
        }
        return configs;
    }
}

module.exports = Configs;