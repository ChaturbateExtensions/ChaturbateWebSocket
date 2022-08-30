const WebSocket = require("ws");
const fs = require("fs");
const axios = require('axios');

const getWSS = async (model,wssLink) => {
    var dateUnfmt = new Date();
    var dateFmt = (dateUnfmt.getMonth()+1)+"-"+dateUnfmt.getDate()+"-"+dateUnfmt.getFullYear();
    var chatLog = [];
    var tipLog = [];
    var tipCount = 0;


    var ws = new WebSocket(wssLink);
    ws.maxTimeout = 5 * 1000;
    var connectMessage = `["{\\"method\\":\\"connect\\",\\"data\\":{\\"user\\":\\"__anonymous__G67D8shJGQ\\",\\"password\\":\\"{\\\\\\"username\\\\\\":\\\\\\"__anonymous__G67D8shJGQ\\\\\\",\\\\\\"room\\\\\\":\\\\\\"`+model+`\\\\\\",\\\\\\"expire\\\\\\":1661080808,\\\\\\"org\\\\\\":\\\\\\"A\\\\\\",\\\\\\"sig\\\\\\":\\\\\\"66cd4f27ca52ab8979ef8c9b6a41c9e5884866e56023444dc255854297dc976e\\\\\\"}\\",\\"room\\":\\"`+model+`\\",\\"room_password\\":\\"dd9188f73958fb725471ae874dbb7e78293e1b2f6711646134c7c24cd713bc3b\\"}}"]`;
    var authResponse = `a["{\\"args\\":[\\"1\\"],\\"callback\\":null,\\"method\\":\\"onAuthResponse\\"}"]`;
    var joinMessage = `["{\\"method\\":\\"joinRoom\\",\\"data\\":{\\"room\\":\\"`+model+`\\",\\"exploringHashTag\\":\\"\\",\\"source_name\\":\\"un\\"}}"]`;
    var updateMessage = `["{\\"method\\":\\"updateRoomCount\\",\\"data\\":{\\"room_uid\\":\\"ZB62MK5\\",\\"model_name\\":\\"`+model+`\\",\\"private_room\\":false}}"]`;

    var logMessages = true;
    var logTips = true;
    var logAll = false;

    ws.onopen = function()
    {
        console.log("Connected to",wssLink)
        ws.send(connectMessage)
    };

    ws.onmessage = async function (event) {
        if (event.data === authResponse) {
            ws.send(joinMessage);
        } else {
            try {
                var msg = event.data.replaceAll('\n', '').replaceAll('\\', '').replaceAll('a["', '').replaceAll('"{"', '{"').replaceAll('}"]', '}]')
                msg = msg.slice(0, msg.length - 1);
                var obj = JSON.parse(msg);
                if (logAll) {
                    console.log(obj);
                }
                if (logMessages) {
                    if (obj.method === "onRoomMsg") {
                        var msgNoImg = obj.args[1].m.split("%%%");
                        msgNoImg = obj.args[1].m.split("%%%")[msgNoImg.length - 1];
                        if (msgNoImg[msgNoImg.length - 1] !== " ") {
                            console.log(obj.args[0] + ":", msgNoImg);
                            var objFmt = obj.args[0] + ": "+msgNoImg
                            chatLog = chatLog.concat(objFmt);
                            if (!fs.existsSync("models/"+model)) {
                                fs.mkdirSync("models/"+model)
                            }
                            if (!fs.existsSync("models/"+model+"/chat")) {
                                fs.mkdirSync("models/"+model+"/chat");
                            }
                            await fs.writeFileSync("models/" + model + "/chat/" + dateFmt + ".txt", chatLog.join("\n"), "utf-8");
                        }
                        ws.send(updateMessage);
                    }
                }
                if (logTips) {
                    if (obj.method === "onNotify") {
                        if (obj.args[0].type === "tip_alert") {
                            console.log(obj.args[0].from_username, "has tipped", obj.args[0].amount, "to", obj.args[0].to_username);
                            tipCount += obj.args[0].amount;
                            console.log(obj.args[0].to_username,"has received a total of",tipCount);

                            var model = {
                                model:obj.args[0].to_username,
                                tipper:obj.args[0].from_username,
                                amount:obj.args[0].amount
                            }
                            tipLog = tipLog.concat(model);
                            axios({method: 'get', url: 'http://localhost:3000/cb?model='+model.model+'&tipper='+model.tipper+'&amount='+model.amount});


                        }
                    }
                }
            } catch (e) {
            }
        }
    };

    ws.onclose = function()
    {
        console.log("Closed")
    };
}


module.exports = getWSS;
