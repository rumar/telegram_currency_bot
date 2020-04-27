"use strict";
const axios = require("axios");
const Telegraf = require("telegraf");
const Extra = require("telegraf/extra");
const Markup = require("telegraf/markup");

const session = require("telegraf/session");
const Stage = require("telegraf/stage");
const Scene = require("telegraf/scenes/base");

const mock = require("./mock");

const token = "1073385196:AAEO-vEVHiGlKgvGMwmakwu5vZin9KeRKMY";
const apiUrl =
  "https://api.privatbank.ua/p24api/pubinfo?json&exchange&coursid=5";

let db = {
  currency: mock.currencyMock || [],
};

const bot = new Telegraf(token);

const mainMenu = Extra.markup((m) =>
  m.inlineKeyboard([
    [m.callbackButton("Узнать курс валют", "get")],
    [m.callbackButton("Пересчитать деньги", "calc")],
  ])
);

bot.command("start", (ctx) => {
  return ctx.replyWithMarkdown(
    `*Привет!*
  Вы чатитесь с _UAH CURRENCY_ ботом!
  Здесь вы можете узнать текущий курс валют или 
  быстро пересчитать деньги к USD, EUR, RUR, BTC относительно курса\n`,
    mainMenu
  );
});
bot.action("get", (ctx) =>
  ctx.replyWithMarkdown(
    getCurrency(db.currency),
    Extra.markup((m) =>
      m.inlineKeyboard([
        [m.callbackButton("Узнать текущий курс валют", "get")],
        [m.callbackButton("Пересчитать деньги", "calc")],
      ])
    )
  )
);

function getCurrency(currency) {
  return `
    *Курс гривны на сегодня:*
    _USD -_ buy: ${currency[0].buy}, sale: ${currency[0].sale}
    _EUR -_ buy: ${currency[1].buy}, sale: ${currency[1].sale}
    _RUR -_ buy: ${currency[2].buy}, sale: ${currency[2].sale}
    _BTC -_ buy: ${currency[3].buy}, sale: ${currency[3].sale}
  `;
}

// Handler factoriess
const { enter, leave } = Stage;
// Greeter scene
const greeterScene = new Scene("greeter");
greeterScene.enter((ctx) => ctx.reply("Hi"));
greeterScene.leave((ctx) => ctx.reply("Bye"));
greeterScene.hears("hi", enter("greeter"));
greeterScene.on("message", (ctx) => ctx.replyWithMarkdown("Send `hi`"));

// Echo scene
const echoScene = new Scene("echo");
echoScene.enter((ctx) => ctx.reply("echo scene"));
echoScene.leave((ctx) => ctx.reply("exiting echo scene"));
echoScene.command("back", leave());
echoScene.on("text", (ctx) => ctx.reply(ctx.message.text));
echoScene.on("message", (ctx) => ctx.reply("Only text messages please"));

bot.on("text", async (ctx) => {
  console.log(ctx.message);
  if (ctx.message.from.username !== "rymaryurii") return;
  console.log(ctx.message.from.username);
  // await axios.get(apiUrl).then((res) => {
  //   db.currency = res.data;
  //   return console.log(res.data);
  // });

  await ctx.replyWithMarkdown(
    getCurrency(db.currency),
    Extra.markup((m) =>
      m.inlineKeyboard([m.callbackButton("Пересчитать деньги", "calc")])
    )
  );
});

const stage = new Stage([greeterScene, echoScene], { ttl: 10 });
bot.use(session());
bot.use(stage.middleware());
bot.action("calc", (ctx) => ctx.scene.enter("greeter"));
bot.command("echo", (ctx) => ctx.scene.enter("echo"));

// TODO:get status, if launch -> stop
bot.stop(() => {
  bot.launch({ polling: { timeout: 1 } });
});
