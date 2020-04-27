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
  selectedCurrency: "",
};

const bot = new Telegraf(token);

const mainMenu = Extra.markup((m) =>
  m.inlineKeyboard([
    [m.callbackButton("Узнать курс валют", "get")],
    [m.callbackButton("Пересчитать деньги", "calc")],
  ])
);
const currencyMenu = Extra.markup((m) =>
  m.inlineKeyboard([
    [m.callbackButton("USD", "usd"), m.callbackButton("EUR", "eur")],
    [m.callbackButton("RUR", "rur"), m.callbackButton("BTC", "btc")],
    [m.callbackButton("Отмена", "cancel")],
  ])
);
const actionMenu = Extra.markup((m) =>
  m.inlineKeyboard([
    [m.callbackButton("Купить", "buy"), m.callbackButton("Продать", "sale")],
    [m.callbackButton("Отмена", "cancel")],
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
      m.inlineKeyboard([m.callbackButton("Пересчитать деньги", "calc")])
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

// Select currency scene
const greeterScene = new Scene("greeter");
greeterScene.enter((ctx) => ctx.reply("Выберете валюту", currencyMenu));
greeterScene.leave((ctx) =>
  ctx.reply(`Вы выбрали валюту ${ctx.session.currency}`)
);
greeterScene.hears("hi", enter("greeter"));
greeterScene.on("message", (ctx) => ctx.replyWithMarkdown("Send `hi`"));

// Select action scene
const echoScene = new Scene("echo");
echoScene.enter((ctx) =>
  ctx.replyWithMarkdown(`Выберите действие`, actionMenu)
);
echoScene.leave((ctx) => ctx.reply("exiting echo scene"));
echoScene.command("cancel", leave());
echoScene.on("text", (ctx) => ctx.reply(ctx.message.text));
echoScene.on("message", (ctx) => ctx.reply("Only text messages please"));

// Enter sum scene
const sumScene = new Scene("summa");
sumScene.enter((ctx) =>
  ctx.replyWithMarkdown(
    "Введите сумму",
    Extra.markup((m) =>
      m.inlineKeyboard([m.callbackButton("Отмена", "cancel")])
    )
  )
);
// todo: not working with bot.on("text")
sumScene.on("text", (ctx) => {
  // console.log(ctx);
  ctx.reply(ctx.message.text);
});

bot.on("text", async (ctx) => {
  console.log(ctx);
  // if (ctx.message.from.username !== "rymaryurii") return;
  // console.log(ctx.message.from.username);
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

function setSessionCurrency(ctx) {
  ctx.session.currency = ctx.match;
  ctx.scene.enter("echo");
}
function setSessionAction(ctx) {
  ctx.session.action = ctx.match;
  ctx.scene.enter("summa");
}

const stage = new Stage([greeterScene, echoScene, sumScene], { ttl: 10 });
bot.use(session());
bot.use(stage.middleware());
bot.action("calc", (ctx) => ctx.scene.enter("greeter"));

bot.action("usd", (ctx) => setSessionCurrency(ctx));
bot.action("eur", (ctx) => setSessionCurrency(ctx));
bot.action("rur", (ctx) => setSessionCurrency(ctx));
bot.action("btc", (ctx) => setSessionCurrency(ctx));
bot.action("cancel", (ctx) => ctx.scene.leave());

bot.action("buy", (ctx) => ctx.scene.enter("summa"));
bot.action("sale", (ctx) => ctx.scene.enter("summa"));

// TODO:get status, if launch -> stop
bot.stop(() => {
  bot.launch({ polling: { timeout: 1 } });
});
