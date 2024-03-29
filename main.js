process.env.NTBA_FIX_319 = 1;
const nodedata = require("./data/node.json");

const config = require("./config");

const fs = require("fs");
const WebSocket = require("ws");
const schedule = require("node-schedule");
const moment = require("moment");
const child_process = require('child_process');

const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot(config.token, { polling: true });

// Func
const update = (s) => {
    return new Promise((resolve, reject) => {
        let wss = new WebSocket(config.nezha);
        wss.on('message', (data) => {
            wss.terminate();
            let info = JSON.parse(data);
            let now = {
                time: new Date() / 1,
                data: []
            }
            for (let i = 0; i < info.servers.length; i++) {
                if (config.nodelist.indexOf(info.servers[i].ID) != -1) {
                    now.data.push({
                        name: info.servers[i].Name,
                        in: info.servers[i].State.NetInTransfer,
                        out: info.servers[i].State.NetOutTransfer,
                        uptime: info.servers[i].State.Uptime
                    })
                }
            }
            if (!s) {
                nodedata.push(now)
                fs.writeFileSync("./data/node.json", JSON.stringify(nodedata));
            }
            resolve(now);
        });
    });
}

const p24 = () => {
    let d24 = {}
    for (let i = 0; i < nodedata.length; i++) {
        if (nodedata[i].time > new Date() - 24 * 60 * 60 * 1000) {
            d24 = nodedata[i];
            break;
        }
    }
    let now = nodedata[nodedata.length - 1];

    let text = "";

    for (let i = 0; i < now.data.length; i++) {
        for (let ii = 0; ii < d24.data.length; ii++) {
            if (now.data[i].name == d24.data[ii].name) {
                let out_t = (now.data[i].out - d24.data[ii].out) / (1024 ** 3);
                let in_t = (now.data[i].in - d24.data[ii].in) / (1024 ** 3);
                text += `# ${now.data[i].name}\nInput: ${(in_t).toFixed(2)}GB\nOutput: ${(out_t).toFixed(2)}GB\nAllTransfer: ${(out_t + in_t).toFixed(2)}GB`
                if (i != now.data.length - 1) {
                    text += "\n\n"
                }
                break;
            }
        }
    }

    let w = child_process.exec("python3 ./c.py");
    w.on('exit', () => {
        bot.sendPhoto(config.group, fs.readFileSync("./t.png"), {
            "caption": `${moment(new Date(d24.time)).format("YYYY-MM-DD HH:mm")} -> ${moment(new Date(now.time)).format("YYYY-MM-DD HH:mm")}\n\n${text}`
        })
    });
}

schedule.scheduleJob("0 0/30 * * * ?", () => {
    update();
});

schedule.scheduleJob("30 55 23 * * *", () => {
    p24()
});

// Error
bot.on("polling_error", console.error);

// Msg
bot.on("message", async (msg) => {
    const chatId = msg.chat.id;
    if (msg.text != undefined) {
        const command = msg.text.split(" ");
        switch (command[0]) {
            case "/now": case "/now" + config.bot:
                let node = await update(true);
                let text = `Time: ${moment(new Date(node.time)).format("YYYY-MM-DD HH:mm")}\n\n`;
                for (let i = 0; i < node.data.length; i++) {
                    let out_t = node.data[i].out / (1024 ** 3)
                    let in_t = node.data[i].in / (1024 ** 3)
                    text += `# ${node.data[i].name}\nInput: ${(in_t).toFixed(2)}GB\nOutput: ${(out_t).toFixed(2)}GB\nAllTransfer: ${(out_t + in_t).toFixed(2)}GB\nUptime: ${(node.data[i].uptime / 60 / 60 / 24).toFixed(2)} Day`
                    if (i != node.data.length - 1) {
                        text += "\n\n"
                    }
                }
                let w = child_process.exec("python3 ./c.py");
                w.on('exit', () => {
                    bot.sendPhoto(chatId, fs.readFileSync("./t.png"), {
                        "caption": text
                    })
                });
                break;
            case "/month": case "/month" + config.bot:
                let m1 = {}
                for (let i = 0; i < nodedata.length; i++) {
                    if (nodedata[i].time > new Date() - 30 * 24 * 60 * 60 * 1000) {
                        m1 = nodedata[i];
                        break;
                    }
                }
                let now = nodedata[nodedata.length - 1], text1 = "";

                for (let i = 0; i < now.data.length; i++) {
                    for (let ii = 0; ii < m1.data.length; ii++) {
                        if (now.data[i].name == m1.data[ii].name) {
                            let out_t = (now.data[i].out - m1.data[ii].out) / (1024 ** 3);
                            let in_t = (now.data[i].in - m1.data[ii].in) / (1024 ** 3);
                            text1 += `# ${now.data[i].name}\nInput: ${(in_t).toFixed(2)}GB\nOutput: ${(out_t).toFixed(2)}GB\nAllTransfer: ${(out_t + in_t).toFixed(2)}GB`
                            if (i != now.data.length - 1) {
                                text1 += "\n\n"
                            }
                            break;
                        }
                    }
                }

                bot.sendMessage(chatId, `${moment(new Date(m1.time)).format("YYYY-MM-DD HH:mm")} -> ${moment(new Date(now.time)).format("YYYY-MM-DD HH:mm")}\n\n${text1}`)
                break;
            case "/nodelist": case "/nodelist" + config.bot:
                bot.sendMessage(chatId, `設定中包含的NodeID:\n${config.nodelist.join(", ")}`)
                break
            case "/addnode": case "/addnode" + config.bot:
                if (config.admin.indexOf(msg.from.id) != -1) {
                    if (command.length == 2 && config.nodelist.indexOf(Number(command[1])) == -1) {
                        config.nodelist.push(Number(command[1]));
                        fs.writeFileSync("./config.json", JSON.stringify(config, null, "  "));
                        bot.sendMessage(chatId, `新增 NodeID: ${Number(command[1])}`)
                    } else {
                        bot.sendMessage(chatId, `發生問題，缺少參數/ID已存在: /addnode id`)
                    }
                } else {
                    bot.sendMessage(chatId, `只有 bot admin 有權限執行這個操作`)
                }
                break
            case "/delnode": case "/delnode" + config.bot:
                if (config.admin.indexOf(msg.from.id) != -1) {
                    if (command.length == 2 && config.nodelist.indexOf(Number(command[1])) != -1) {
                        config.nodelist.splice(config.nodelist.indexOf(Number(command[1])), 1)
                        fs.writeFileSync("./config.json", JSON.stringify(config, null, "  "));
                        bot.sendMessage(chatId, `刪除 NodeID: ${Number(command[1])}`)
                    } else {
                        bot.sendMessage(chatId, `發生問題:，缺少參數: /delnode id`)
                    }
                } else {
                    bot.sendMessage(chatId, `只有 bot admin 有權限執行這個操作`)
                }
                break
        }
    }
});

console.log("Start Bot...")