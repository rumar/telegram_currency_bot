"use strict";
const axios = require("axios");
const Telegraf = require("telegraf");

const token = "1073385196:AAEO-vEVHiGlKgvGMwmakwu5vZin9KeRKMY";
const apiUrl =
  "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5";

const bot = new Telegraf(token);

bot.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log("Response time: %sms", ms);
});

// bot.context.db = {
//   getScores: (val) => {
//     return val;
//   },
// };

bot.on("text", (ctx) => {
  axios.get(apiUrl).then(res => {
      console.log(res.data)
  })
  return ctx.reply(`${ctx.message.from.username}`);
});
bot.launch();
