'use strict';

const { Client } = require('tdl');
const { TDLib } = require('tdl-tdlib-ffi');
require('dotenv').config();
const redis = require("redis");
const redisClient = redis.createClient();
redisClient.on('error', function (error) {
    console.log('redis error : ', error)
})

const MessageClass = require("./class/message");
const Logic = require("./class/logic");
const ConfigsClass = require("./class/configs");

const client = new Client(new TDLib(process.env.TDLIB_PATH), {
    apiId: process.env.API_ID, 
    apiHash: process.env.API_HASH,
    databaseDirectory: process.env.DATABASE_DIRECTORY,
    filesDirectory: process.env.FILE_DIRECTORY
});

async function main() {
  const configsObject = new ConfigsClass();
  const configs = await configsObject.getConfigs();
  
  if(!configs.enable_main_bot){
    process.exit();
  }

  client
  .on('update', update => {
    if(update.chat_id && (update.chat_id==configs.firstGroupChatId || update.chat_id==configs.secondGroupChatId || update.chat_id==configs.thirdGroupChatId)  && (update._=="updateChatLastMessage" || update._=="updateDeleteMessages")){
      if(update._=="updateChatLastMessage"){
        const msg = update.last_message.content.text.text;
        const msgObject = new MessageClass(redisClient, msg, update.last_message.sender_user_id, update.last_message.id, update.chat_id);
        if(msgObject.status)
          Logic.findPrices(redisClient, client, configs).then().catch(err => console.log('PRICES Error:', err))  

      }else {
        MessageClass.deleteMessages(redisClient, update.message_ids)
      }
    }
  })
  .on('error', err => {
    console.error('Got error:', JSON.stringify(err, null, 2))
  })
  .on('destroy', () => {
    console.log('destroy event')
  })
  await client.connectAndLogin();
}

main();