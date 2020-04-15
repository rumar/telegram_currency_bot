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

let db = {
  currency: []
}

bot.on("text", async (ctx) => {
  await axios.get(apiUrl).then(res => {
    db.currency = res.data;
    return console.log(res.data)
  })
  await ctx.replyWithHTML(`
    <b>UAH Curency for today</b>\n
    <b>USD -</b> buy: ${db.currency[0].buy}, sale: ${db.currency[0].sale}\n
    <b>EUR -</b> buy: ${db.currency[1].buy}, sale: ${db.currency[1].sale}\n
    <b>RUR -</b> buy: ${db.currency[2].buy}, sale: ${db.currency[2].sale}\n
    <b>BTC -</b> buy: ${db.currency[3].buy}, sale: ${db.currency[3].sale}\n
  `);
});
bot.launch();
