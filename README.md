# nezha-traffic-bot

統計流量的 Telegram Bot，基於 [naiba/nezha](https://github.com/naiba/nezha) 探針 API

-----

## 這個 bot 可以做什麼？

- 傳送 `/now` 命令，推送選定 Server ID 的伺服器流量使用情況/Uptime
- 每天 23:55 推送今天流量使用情況

- `/nodelist` 檢視當前記錄的 NodeID
- `/addnode` 新增 NodeID （需要配置 admin user id）
- `/delnode` 刪除 NodeID （需要配置 admin user id）

## Start

```
git clone https://github.com/ArsFy/nezha-traffic-bot.git
cd nezha-traffic-bot
npm i
```

### install (Python3)

```
pip3 install matplotlib
```

### Config

重新命名 `config.example.json` 為 `config.json`

```js
{
    "token": "123456:Agagagasgagagagagg",  // Bot Token
    "bot": "@xxx_bot",                     // bot username
    "nezha": "wss://xx.xxx.com/ws",        // 使用探針網域替換 xx.xxx.com
    "group": "@xxx",                       // 日報推送群組
    "nodelist": [1, 2]                     // NodeID，nezha panel 有顯示
    "admin": [ 100000000 ]             // Telegram Admin User ID
}
```

### Run

```
node main.js
```