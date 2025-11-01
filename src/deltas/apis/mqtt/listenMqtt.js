"use strict";
const utils = require('../../../utils');
const mqtt = require('mqtt');
const websocket = require('websocket-stream');
const HttpsProxyAgent = require('https-proxy-agent');
const EventEmitter = require('events');
const { parseDelta } = require('./deltas/value');

// Module-level state
let form = {};
let getSeqID;

// Constants
const MQTT_TOPICS = [
    "/legacy_web", "/webrtc", "/rtc_multi", "/onevc", "/br_sr", "/sr_res",
    "/t_ms", "/thread_typing", "/orca_typing_notifications", "/notify_disconnect",
    "/orca_presence", "/inbox", "/mercury", "/messaging_events",
    "/orca_message_notifications", "/pp", "/webrtc_response"
];

const MQTT_CONFIG = {
    KEEPALIVE_INTERVAL: 60, // Increased to 60 seconds for better stability
    CONNECT_TIMEOUT: 60000,
    RECONNECT_PERIOD: 3000, // Increased to 3 seconds for more stable reconnections
    PRESENCE_UPDATE_INTERVAL: 50000,
    MIN_RECONNECT_TIME: 2 * 60 * 60 * 1000, // 2 hours - increased from 26 minutes
    MAX_RECONNECT_TIME: 4 * 60 * 60 * 1000, // 4 hours - increased from 1 hour
    PROTOCOL_VERSION: 3,
    QOS_LEVEL: 1
};

const SYNC_CONFIG = {
    API_VERSION: 10,
    MAX_DELTAS: 1000,
    BATCH_SIZE: 500,
    ENCODING: "JSON"
};

/**
 * Generates a RFC4122 version 4 compliant UUID
 * @returns {string} A randomly generated UUID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Calculates a random reconnection time within configured bounds
 * @returns {number} Random time in milliseconds
 */
function getRandomReconnectTime() {
    const range = MQTT_CONFIG.MAX_RECONNECT_TIME - MQTT_CONFIG.MIN_RECONNECT_TIME;
    return Math.floor(Math.random() * (range + 1)) + MQTT_CONFIG.MIN_RECONNECT_TIME;
}

/**
 * Calculates adjusted timestamp for synchronization
 * Reserved for future use in timestamp calculation
 * @param {number} previousTimestamp - Previous timestamp
 * @param {number} currentTimestamp - Current timestamp
 * @returns {number} Calculated timestamp
 */
function _calculateTimestamp(previousTimestamp, currentTimestamp) {
    return Math.floor(previousTimestamp + (currentTimestamp - previousTimestamp) + 300);
}

/**
 * Automatically marks a thread as read if autoMarkRead is enabled
 * @param {Object} ctx - Application context
 * @param {Object} api - API instance
 * @param {string} threadID - Thread ID to mark as read
 */
function markAsRead(ctx, api, threadID) {
    if (!ctx.globalOptions.autoMarkRead || !threadID) {
        return;
    }
    
    api.markAsRead(threadID, (err) => {
        if (err) {
            utils.error("autoMarkRead", `Failed to mark thread ${threadID} as read:`, err);
        }
    });
}

/**
 * Builds MQTT username configuration object
 * @param {Object} ctx - Application context
 * @param {number} sessionID - Session identifier
 * @returns {Object} MQTT username configuration
 */
function buildMqttUsername(ctx, sessionID) {
    return {
        u: ctx.userID,
        s: sessionID,
        chat_on: ctx.globalOptions.online,
        fg: false,
        d: ctx.clientID,
        ct: 'websocket',
        aid: ctx.mqttAppID,
        mqtt_sid: '',
        cp: 3,
        ecp: 10,
        st: [],
        pm: [],
        dc: '',
        no_auto_fg: true,
        gas: null,
        pack: [],
        a: ctx.globalOptions.userAgent
    };
}

/**
 * Builds MQTT connection options
 * @param {Object} ctx - Application context
 * @param {string} host - WebSocket host URL
 * @param {Object} username - MQTT username configuration
 * @returns {Object} MQTT client options
 */
function buildMqttOptions(ctx, host, username) {
    const cookies = ctx.jar.getCookiesSync('https://www.facebook.com').join('; ');
    
    const options = {
        clientId: 'mqttwsclient',
        protocolId: 'MQIsdp',
        protocolVersion: MQTT_CONFIG.PROTOCOL_VERSION,
        username: JSON.stringify(username),
        clean: true,
        wsOptions: {
            headers: {
                'Cookie': cookies,
                'Origin': 'https://www.messenger.com',
                'User-Agent': username.a,
                'Referer': 'https://www.messenger.com/',
                'Host': new URL(host).hostname
            },
            origin: 'https://www.messenger.com',
            protocolVersion: 13,
            binaryType: 'arraybuffer'
        },
        keepalive: MQTT_CONFIG.KEEPALIVE_INTERVAL,
        reschedulePings: true,
        connectTimeout: MQTT_CONFIG.CONNECT_TIMEOUT,
        reconnectPeriod: MQTT_CONFIG.RECONNECT_PERIOD
    };

    // Add proxy support if configured
    if (ctx.globalOptions.proxy) {
        options.wsOptions.agent = new HttpsProxyAgent(ctx.globalOptions.proxy);
    }

    return options;
}

/**
 * Main MQTT listener function - establishes and manages MQTT connection
 * @param {Object} defaultFuncs - Default API functions
 * @param {Object} api - API instance
 * @param {Object} ctx - Application context containing configuration and state
 * @param {Function} globalCallback - Callback for handling incoming messages and errors
 * @throws {utils.NetworkError} When connection fails
 */
async function listenMqtt(defaultFuncs, api, ctx, globalCallback) {
    try {
        // Generate session identifiers
        const sessionID = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER) + 1;
        
        // Build connection URL
        const domain = "wss://edge-chat.messenger.com/chat";
        const host = ctx.region 
            ? `${domain}?region=${ctx.region.toLowerCase()}&sid=${sessionID}&cid=${ctx.clientID}`
            : `${domain}?sid=${sessionID}&cid=${ctx.clientID}`;

        utils.log("Connecting to MQTT...", host);

        // Build MQTT configuration
        const username = buildMqttUsername(ctx, sessionID);
        const options = buildMqttOptions(ctx, host, username);

        // Create MQTT client with promisified publish method
        const mqttClient = new mqtt.Client(() => websocket(host, options.wsOptions), options);
        
        // Store original publish method
        mqttClient.publishSync = mqttClient.publish.bind(mqttClient);
        
        // Wrap publish method to return a Promise
        mqttClient.publish = (topic, message, opts = {}, callback = () => {}) => {
            return new Promise((resolve, reject) => {
                mqttClient.publishSync(topic, message, opts, (err, data) => {
                    if (err) {
                        callback(err);
                        return reject(err);
                    }
                    callback(null, data);
                    resolve(data);
                });
            });
        };

        // Store client reference in context
        ctx.mqttClient = mqttClient;

        // Handle MQTT connection errors
        mqttClient.on('error', (err) => {
            const networkError = new utils.NetworkError(
                `MQTT connection error: ${err.message}`,
                { originalError: err, host }
            );
            utils.error("listenMqtt", networkError);
        });

        // Handle MQTT disconnection/offline events
        mqttClient.on('offline', () => {
            utils.warn("⚠️  MQTT client went offline. Will attempt reconnection...");
            ctx.mqttConnected = false;
        });

        mqttClient.on('close', () => {
            utils.warn("🔌 MQTT connection closed. Reconnecting...");
            ctx.mqttConnected = false;
            
            if (ctx.globalOptions.autoReconnect !== false) {
                setTimeout(() => {
                    if (!ctx.mqttClient || !ctx.mqttClient.connected) {
                        utils.log("🔄 Triggering MQTT reconnection...");
                        getSeqID();
                    }
                }, 5000);
            }
        });

        mqttClient.on('reconnect', () => {
            utils.log("🔄 MQTT reconnecting...");
        });

        // Handle successful connection
        mqttClient.on('connect', async () => {
            try {
                // Subscribe to all topics
                MQTT_TOPICS.forEach(topic => {
                    mqttClient.subscribe(topic, (err) => {
                        if (err) {
                            utils.error(`Failed to subscribe to ${topic}:`, err);
                        }
                    });
                });

                // Build sync queue configuration
                const queue = {
                    sync_api_version: SYNC_CONFIG.API_VERSION,
                    max_deltas_able_to_process: SYNC_CONFIG.MAX_DELTAS,
                    delta_batch_size: SYNC_CONFIG.BATCH_SIZE,
                    encoding: SYNC_CONFIG.ENCODING,
                    entity_fbid: ctx.userID
                };

                // Determine sync topic based on token availability
                let syncTopic;
                if (ctx.syncToken) {
                    syncTopic = "/messenger_sync_get_diffs";
                    queue.last_seq_id = ctx.lastSeqId;
                    queue.sync_token = ctx.syncToken;
                } else {
                    syncTopic = "/messenger_sync_create_queue";
                    queue.initial_titan_sequence_id = ctx.lastSeqId;
                    queue.device_params = null;
                }

                utils.log("✅ Successfully connected to MQTT");
                ctx.mqttConnected = true;

                // Get and log bot information
                try {
                    const { name: botName = "Facebook User", uid = ctx.userID } = 
                        await api.getBotInitialData();
                    utils.log(`👤 Logged in as: ${botName} (${uid})`);
                } catch (botInfoErr) {
                    utils.warn("Could not retrieve bot info:", botInfoErr.message);
                }

                // Publish sync queue configuration
                await mqttClient.publish(
                    syncTopic, 
                    JSON.stringify(queue), 
                    { qos: MQTT_CONFIG.QOS_LEVEL, retain: false }
                );
            } catch (connectErr) {
                utils.error("Error in connect handler:", connectErr);
                globalCallback(new utils.NetworkError(
                    "Failed to initialize MQTT connection",
                    { originalError: connectErr }
                ));
            }
        });

        // Set up presence updates if enabled
        let presenceInterval;
        if (ctx.globalOptions.updatePresence) {
            presenceInterval = setInterval(() => {
                if (!mqttClient || !mqttClient.connected) {
                    return;
                }

                try {
                    const presencePayload = utils.generatePresence(ctx.userID);
                    mqttClient.publish(
                        '/orca_presence',
                        JSON.stringify({ "p": presencePayload }),
                        (err) => {
                            if (err) {
                                utils.error("Failed to send presence update:", err);
                            }
                        }
                    );
                } catch (presenceErr) {
                    utils.error("Error generating presence update:", presenceErr);
                }
            }, MQTT_CONFIG.PRESENCE_UPDATE_INTERVAL);

            // Store interval reference for cleanup
            ctx.presenceInterval = presenceInterval;
        }

        // Track last message received time for health monitoring
        ctx.lastMessageTime = Date.now();
        ctx.messageCount = 0;

        // Handle incoming MQTT messages
        mqttClient.on('message', async (topic, message, _packet) => {
            try {
                // Update health tracking
                ctx.lastMessageTime = Date.now();
                ctx.messageCount++;

                // Parse message payload
                const jsonMessage = JSON.parse(message.toString());

                // Debug logging (disabled by default)
                // console.log("Topic:", topic, "| Deltas:", jsonMessage.deltas?.length || 0);
                
                // Handle different message types based on topic
                if (topic === "/t_ms") {
                    // Update sequence ID if provided
                    if (jsonMessage.lastIssuedSeqId) {
                        ctx.lastSeqId = parseInt(jsonMessage.lastIssuedSeqId, 10);
                    }

                    // Process deltas (message updates)
                    if (jsonMessage.deltas && Array.isArray(jsonMessage.deltas)) {
                        for (const delta of jsonMessage.deltas) {
                            try {
                                parseDelta(defaultFuncs, api, ctx, globalCallback, { delta });
                            } catch (deltaErr) {
                                utils.error("Error parsing delta:", deltaErr);
                            }
                        }
                    }
                } else if (topic === "/mercury" || topic === "/messaging_events" || topic === "/orca_message_notifications") {
                    // Handle messages from other topics (often personal messages)
                    if (jsonMessage.deltas && Array.isArray(jsonMessage.deltas)) {
                        for (const delta of jsonMessage.deltas) {
                            try {
                                parseDelta(defaultFuncs, api, ctx, globalCallback, { delta });
                            } catch (deltaErr) {
                                utils.error("Error parsing delta from " + topic + ":", deltaErr);
                            }
                        }
                    }
                } else if (topic === "/thread_typing" || topic === "/orca_typing_notifications") {
                    // Handle typing indicators
                    const typingEvent = {
                        type: "typ",
                        isTyping: !!jsonMessage.state,
                        from: jsonMessage.sender_fbid?.toString() || "",
                        threadID: utils.formatID(
                            (jsonMessage.thread || jsonMessage.sender_fbid)?.toString() || ""
                        ),
                        fromMobile: jsonMessage.from_mobile || false
                    };
                    globalCallback(null, typingEvent);
                }
                // Uncomment for debugging unhandled topics:
                // else { console.log("Unhandled topic:", topic); }
            } catch (parseErr) {
                utils.error(`Error processing message from topic ${topic}:`, parseErr);
            }
        });

    } catch (setupErr) {
        // Handle any errors during MQTT setup
        const error = new utils.NetworkError(
            "Failed to setup MQTT listener",
            { originalError: setupErr }
        );
        utils.error("listenMqtt setup error:", error);
        globalCallback(error);
    }
}

/**
 * Main module export - creates MQTT listener with reconnection management
 * @param {Object} defaultFuncs - Default API functions
 * @param {Object} api - API instance
 * @param {Object} ctx - Application context
 * @returns {Function} Listener function that returns MessageEmitter
 */
module.exports = (defaultFuncs, api, ctx) => {
    let globalCallback = () => {};
    let reconnectInterval;

    /**
     * Retrieves the sequence ID required for MQTT synchronization
     * @async
     * @throws {utils.AuthenticationError} When unable to retrieve sequence ID
     */
    getSeqID = async () => {
        try {
            utils.log("Fetching sequence ID...");
            
            form = {
                "queries": JSON.stringify({
                    "o0": {
                        "doc_id": "3336396659757871",
                        "query_params": {
                            "limit": 1,
                            "before": null,
                            "tags": ["INBOX"],
                            "includeDeliveryReceipts": false,
                            "includeSeqID": true
                        }
                    }
                })
            };

            const resData = await defaultFuncs
                .post("https://www.facebook.com/api/graphqlbatch/", ctx.jar, form)
                .then(utils.parseAndCheckLogin(ctx, defaultFuncs));

            // Validate response
            if (utils.getType(resData) !== "Array") {
                throw new utils.ValidationError("Invalid response format from sequence ID endpoint");
            }

            if (resData.error && resData.error !== 1357001) {
                throw new utils.AuthenticationError(
                    "Authentication error while fetching sequence ID",
                    { errorCode: resData.error }
                );
            }

            // Extract and store sequence ID
            ctx.lastSeqId = resData[0]?.o0?.data?.viewer?.message_threads?.sync_sequence_id;
            
            if (!ctx.lastSeqId) {
                throw new utils.ValidationError("Sequence ID not found in response");
            }

            utils.log(`✅ Sequence ID retrieved: ${ctx.lastSeqId}`);

            // Start MQTT listener
            listenMqtt(defaultFuncs, api, ctx, globalCallback);
            
        } catch (err) {
            const authError = new utils.AuthenticationError(
                "Failed to get sequence ID. This is often caused by an invalid or expired appstate. " +
                "Please try generating a new appstate.json file.",
                { originalError: err }
            );
            utils.error("getSeqID error:", authError);
            return globalCallback(authError);
        }
    };

    ctx.reconnectMqtt = async () => {
        try {
            utils.log("🔄 Reconnecting MQTT...");
            
            if (ctx.mqttClient) {
                try {
                    ctx.mqttClient.end(true);
                } catch (endErr) {
                    utils.error("Error ending MQTT client:", endErr);
                }
                ctx.mqttClient = null;
            }
            
            ctx.clientID = generateUUID();
            await getSeqID();
        } catch (err) {
            utils.error("Failed to reconnect MQTT:", err);
            throw err;
        }
    };

    /**
     * Returns the listener function that manages MQTT connection and events
     * @param {Function} [callback] - Optional callback for handling messages
     * @returns {MessageEmitter} Event emitter for messages and errors
     */
    return async (callback) => {
        /**
         * Message event emitter with cleanup capabilities
         * @extends EventEmitter
         */
        class MessageEmitter extends EventEmitter {
            /**
             * Stops the MQTT listener and cleans up resources
             */
            stop() {
                utils.log("Stopping MQTT listener...");
                
                // Clear global callback
                globalCallback = () => {};
                
                // Clear reconnection interval
                if (reconnectInterval) {
                    clearTimeout(reconnectInterval);
                    reconnectInterval = null;
                }
                
                // Clear presence update interval
                if (ctx.presenceInterval) {
                    clearInterval(ctx.presenceInterval);
                    ctx.presenceInterval = null;
                }
                
                // Close MQTT connection
                if (ctx.mqttClient) {
                    try {
                        ctx.mqttClient.end();
                        ctx.mqttClient = undefined;
                    } catch (err) {
                        utils.error("Error stopping MQTT client:", err);
                    }
                }
                
                this.emit('stop');
                utils.log("✅ MQTT listener stopped");
            }
        }

        const msgEmitter = new MessageEmitter();

        // Set up global callback handler
        globalCallback = (error, message) => {
            if (error) {
                return msgEmitter.emit("error", error);
            }
            
            // Auto-mark read for new messages if enabled
            if (message && (message.type === "message" || message.type === "message_reply")) {
                markAsRead(ctx, api, message.threadID);
            }
            
            msgEmitter.emit("message", message);
        };

        // Allow custom callback override
        if (typeof callback === 'function') {
            globalCallback = callback;
        }

        // Initialize connection
        if (!ctx.firstListen || !ctx.lastSeqId) {
            await getSeqID();
        } else {
            listenMqtt(defaultFuncs, api, ctx, globalCallback);
        }

        // Mark all messages as read on first listen
        if (ctx.firstListen) {
            try {
                utils.log("Marking all messages as read on startup...");
                await api.markAsReadAll();
            } catch (err) {
                utils.warn("Failed to mark all messages as read on startup:", err);
            }
        }

        ctx.firstListen = false;

        /**
         * Schedules periodic MQTT reconnections to maintain connection health
         */
        async function scheduleReconnect() {
            const time = getRandomReconnectTime();
            const hours = Math.floor(time / 3600000);
            const minutes = Math.floor((time % 3600000) / 60000);
            const timeStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} minutes`;
            utils.log(`🔄 Scheduled reconnect in ${timeStr} (${time}ms)`);
            
            reconnectInterval = setTimeout(() => {
                utils.log("⏰ Reconnecting MQTT with new clientID...");
                
                // Close existing connection
                if (ctx.mqttClient) {
                    try {
                        ctx.mqttClient.end(true);
                    } catch (err) {
                        utils.error("Error ending existing connection:", err);
                    }
                }
                
                // Generate new client ID and reconnect
                ctx.clientID = generateUUID();
                listenMqtt(defaultFuncs, api, ctx, globalCallback);
                
                // Schedule next reconnection
                scheduleReconnect();
            }, time);
        }

        // Start reconnection scheduler
        scheduleReconnect();

        return msgEmitter;
    };
};
