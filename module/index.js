"use strict";

const { login } = require('../src/core/client');

/**
 * ws3-fca - Facebook Chat API
 * 
 * A powerful Node.js library for automating Facebook Messenger interactions.
 * Provides a comprehensive API for sending messages, managing threads, retrieving user info,
 * and much more through a clean, promise-based interface.
 * 
 * @module ws3-fca
 * @author NethWs3Dev
 * @license MIT
 * 
 * @example
 * const { login } = require('ws3-fca');
 * const fs = require('fs');
 * 
 * const appState = JSON.parse(fs.readFileSync('appstate.json', 'utf8'));
 * 
 * login({ appState }, (err, api) => {
 *   if (err) return console.error(err);
 *   
 *   api.sendMessageMqtt('Hello!', 'THREAD_ID', (err, info) => {
 *     if (err) return console.error(err);
 *     console.log(`Message sent with ID: ${info.messageID}`);
 *   });
 * });
 */

module.exports = { login };
