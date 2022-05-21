process.env.NTBA_FIX_319 = 1;
const nodedata = require("./data/node.json");

const config = require("./config");

const fs = require("fs");
const WebSocket = require("ws");
const schedule = require("node-schedule");
const moment = require("moment");

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
                time: Math.ceil(new Date() / 1000),
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
            if (s) {
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
        if (nodedata[i].time < new Date() - 24 * 60 * 60) {
            d24 = nodedata[i];
            break;
        }
    }
    let now = nodedata[nodedata.length - 1];

    let text = "";

    for (let i = 0; i < now.data.length; i++) {
        for (let ii = 0; ii < d24.data.length; ii++) {
            if (now.data[i].name == d24.data[i].name) {
                let out_t = (now.data[i].out - d24.data[i].out) / (1024 ** 3)
                let in_t = (now.data[i].in - d24.data[i].in) / (1024 ** 3)
                text += `# ${now.data[i].name}\nInput: ${(in_t).toFixed(2)}GB\nOutput: ${(out_t).toFixed(2)}GB\nAllTransfer: ${(out_t + in_t).toFixed(2)}GB`
                if (i != now.data.length - 1) {
                    text += "\n\n"
                }
                break;
            }
        }
    }

    bot.sendMessage(config.group, `${moment(new Date(d24.time * 1000)).format("YYYY-MM-DD HH:ss")} -> ${moment(new Date(now.time * 1000)).format("YYYY-MM-DD HH:ss")}\n\n${text}`)
}

schedule.scheduleJob("0 0/30 * * * ?", () => {
    update();
});

schedule.scheduleJob("30 23 55 * * *", () => {
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
                let text = `Time: ${moment(new Date(node.time * 1000)).format("YYYY-MM-DD HH:ss")}\n\n`;
                for (let i = 0; i < node.data.length; i++) {
                    let out_t = node.data[i].out / (1024 ** 3)
                    let in_t = node.data[i].in / (1024 ** 3)
                    text += `# ${node.data[i].name}\nInput: ${(in_t).toFixed(2)}GB\nOutput: ${(out_t).toFixed(2)}GB\nAllTransfer: ${(out_t + in_t).toFixed(2)}GB\nUptime: ${(node.data[i].uptime / 60 / 60 / 24).toFixed(2)} Day`
                    if (i != node.data.length - 1) {
                        text += "\n\n"
                    }
                }
                bot.sendMessage(chatId, text);
                break;
        }
    }
});

console.log("Start Bot...")