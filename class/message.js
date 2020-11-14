class MessageClass {
    constructor (client, rawMessage, userId, messageId, chatId) {
        this.upperMessage = null
        this.isSale = false
        if(rawMessage.split("\n").length>1){
            this.upperMessage = rawMessage.split("\n")[0]
            if(this.upperMessage.indexOf('خودکار')>=0){
                this.isSale = true
            }
            rawMessage = rawMessage.split("\n")[1]
        }

        this.userId = userId
        this.status = false
        this.messageId = messageId
        this.chatId = chatId

        if(rawMessage.charCodeAt(0)==55357 && rawMessage.charCodeAt(1)==56628){
            this.color = 'red'
        }else if(rawMessage.charCodeAt(0)==55357 && rawMessage.charCodeAt(1)==56629){
            this.color = 'blue'
        }

        let rawSplitMessage = rawMessage.split(' ')
        let remainings = rawMessage.split(':')
        this.remaining = -1
        if(remainings.length==2){
            remainings = parseInt(remainings[1].replace(')', '').replace(/ /g, ''), 10)
            if(!isNaN(remainings)){
                this.remaining = remainings
            }
        }

        if(this.color && rawSplitMessage.length>=4){
            let tmpCount, tmpPrice, tmpName = ''
            for(let i = 1;i < rawSplitMessage.length-1;i++){
                tmpCount = rawSplitMessage[i-1]
                tmpPrice = rawSplitMessage[i+1]
                if(rawSplitMessage[i]=='ف' || rawSplitMessage[i]=='خ'){
                    this.count = parseInt(tmpCount, 10)
                    if(this.remaining<0){
                        this.remaining = this.count
                    }
                    this.price = tmpPrice
                    this.name = tmpName
                    if(rawSplitMessage[i]=='ف'){
                        this.type = 'sale'
                    }else {
                        this.type = 'buy'
                    }
                }else {
                    tmpName += rawSplitMessage[i-1]
                }
            }
            if(rawMessage.indexOf('لغو شد') > 0){
                client.del('user_' + this.type + '_' + this.name)
                if(this.type=='sale'){
                    client.get('low', function(err, res){
                        if(!err){
                            if(res.name==this.name){
                                client.del('low')
                            }
                        }
                    })
                }else{
                    client.get('high', function(err, res){
                        if(!err){
                            if(res.name==this.name){
                                client.del('high')
                            }
                        }
                    })
                }
                
            }else if(this.count && this.price && this.count>0 && this.remaining>0){
                this.status = true
                client.set('user_' + this.type + '_' + this.name, JSON.stringify(this))
                client.expire('user_' + this.type + '_' + this.name,  58)
            }
        }
    }

    static async getValue(client, key) {
        // console.log('getting value of ', key)
        return new Promise(function (resolve, reject) {
            client.get(key, function (err, value) {
                if (err) {
                    console.log('get key error', err)
                    return reject(err)
                }
                // console.log('value', value)
                try {
                    value = JSON.parse(value)
                } catch (e) {}
                return resolve(value)
            })
        })
    }

    static deleteMessages(client, messageIds) {
        client.keys(`user_*`, async function (err, keys) {
            if (err) {
                return err
            }
            const low = await MessageClass.getValue(client, 'low')
            const high = await MessageClass.getValue(client, 'high')
            for (const key of keys) {
                const value = await MessageClass.getValue(client, key)
                if(messageIds.indexOf(value.messageId)>=0){
                    client.del(key)

                    if(low && low.messageId==value.messageId){
                        client.del('low')
                    }else if(high && high.messageId==value.messageId){
                        client.del('high')
                    }
                }
            }
        })
    }
}

module.exports = MessageClass;