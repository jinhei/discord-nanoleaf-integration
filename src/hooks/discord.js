/**
 * Discord RPC official documentation:
 *   https://discord.com/developers/docs/topics/rpc
 * discord-rpc JS documentation is non-existent -- use source code instead:
 *   https://github.com/discordjs/RPC/tree/master
 */
import { ChannelTypes, RPCCommands, RPCEvents } from 'discord-rpc/src/constants';
import { useCallback, useEffect, useRef, useState } from 'react';
import Logger from '../helpers/logger';

const logger = new Logger({ name: 'discord' });

const wait = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Retry RPC fn until it resolves, since it's sometimes just "lost"
 * @param {fuction} fn rpc.subscribe or rpc.command
 * @param  {...any} args
 * @returns {Promise}
 */
const withRetry = (rpc, method, ...args) => new Promise(async (res, rej) => {
  let hasResolved = false;
  let tries = 0;
  const makeRequest = () => rpc[method](...args)
    .then((data) => {
      logger.log(method, 'resolve', { args, data });
      hasResolved = true;
      res(data);
    })
    .catch((e) => {
      hasResolved = true;
      rej(e);
    });
  makeRequest();
  while (!hasResolved) {
    await wait(3000);
    if (!hasResolved) {
      tries += 1;
      logger.log(method, 'retry', { args, tries });
      makeRequest();
    }
  }
});

export function useConnected(rpc) {
  const [isConnected, setConnected] = useState();
  useEffect(() => {
    ['connected', 'ready'].forEach((e) => {
      rpc.on(e, (data) => {
        logger.log(e.toUpperCase(), data);
        setConnected(true);
      });
    });
    ['close', 'disconnected', 'error'].forEach((e) => {
      rpc.on(e, (data) => {
        logger.log(e.toUpperCase(), data);
        setConnected(false);
      });
    });
  }, [rpc]);
  return isConnected;
}

export function useUser(rpc) {
  // login
  const [user, setUser] = useState(rpc.user || null);
  const login = useCallback(() => rpc
    .login({
      scopes: ['rpc', 'messages.read'],
      // TODO: user inputs their client id/secret?
      clientId: process.env.REACT_APP_DISCORD_CLIENT_ID,
      clientSecret: process.env.REACT_APP_DISCORD_CLIENT_SECRET,
      redirectUri: 'http://localhost:5000/api/auth/discord/callback',
    })
    .then((data) => {
      logger.log('LOGIN', data);
      setUser(rpc.user);
      return data;
    })
    .catch((e) => {
      logger.error('LOGIN error', e);
      throw e;
    }),
    // eslint-disable-next-line indent
    [rpc, setUser],
  );
  return [user, login];
}

export function useVoiceChannelId(isLoggedIn, rpc) {
  // channel ID
  const [channelId, setChannelId] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      withRetry(rpc, 'request', RPCCommands.GET_SELECTED_VOICE_CHANNEL)
        .then((data) => {
          setChannelId((data && (data.id || data.channel_id)) || null);
        });

      withRetry(rpc, 'subscribe', RPCEvents.VOICE_CHANNEL_SELECT, (data) => {
        setChannelId(data.channel_id || null);
      });
      // logger.log('Subscribe: CHANNEL_CREATE');
      // withRetry(rpc, 'subscribe', RPCEvents.CHANNEL_CREATE, data => {
      //   logger.log('CHANNEL_CREATE', data);
      //   setChannelId(data.channel_id || null);
      // })
      //   .then(data => {
      //     logger.log('CHANNEL_CREATE subscribe success', data);
      //   });
    }
  }, [isLoggedIn, rpc]);
  return channelId;
}

export function useVoiceSettings(channelId, rpc) {
  // voice settings
  const [voiceSettings, setVoiceSettings] = useState();
  const voiceSettingsUnsubscribeRef = useRef(null);
  const rpcUnsubscribe = useCallback(() => {
    if (voiceSettingsUnsubscribeRef.current) {
      logger.log('unsubscribe: VOICE_STATE_UPDATE');
      voiceSettingsUnsubscribeRef.current();
    }
  }, []);

  useEffect(() => {
    rpcUnsubscribe();
    if (channelId) {
      withRetry(
        rpc,
        'request',
        RPCCommands.GET_VOICE_SETTINGS,
      ).then(setVoiceSettings);
      logger.log('Subscribe: VOICE_SETTINGS_UPDATE');
      withRetry(
        rpc,
        'subscribe',
        RPCEvents.VOICE_SETTINGS_UPDATE,
        (data) => {
          setVoiceSettings(data);
        },
      )
        .then(({ unsubscribe }) => {
          logger.log('Subscribe success', RPCEvents.VOICE_SETTINGS_UPDATE, unsubscribe);
          voiceSettingsUnsubscribeRef.current = unsubscribe;
        });
    }
    return () => rpcUnsubscribe();
  }, [rpc, channelId, rpcUnsubscribe]);

  return voiceSettings;
}

export function useVoiceState(user, channelId, rpc) {
  // voice state
  const [voiceState, setVoiceState] = useState();
  const voiceStateUnsubscribeRef = useRef(null);
  const rpcUnsubscribe = useCallback(() => {
    if (voiceStateUnsubscribeRef.current) {
      logger.log('unsubscribe: VOICE_STATE_UPDATE');
      voiceStateUnsubscribeRef.current();
    }
  }, []);

  useEffect(() => {
    rpcUnsubscribe();
    if (channelId) {
      logger.log('Subscribe: VOICE_STATE_UPDATE');
      if (!voiceState) {
        withRetry(rpc, 'request', RPCCommands.GET_CHANNEL, { channel_id: channelId })
          .then((data) => {
            setVoiceState(data.voice_states.find((s) => s.user.id === user.id).voice_state);
          });
      }
      withRetry(
        rpc,
        'subscribe',
        RPCEvents.VOICE_STATE_UPDATE,
        { channel_id: channelId },
        (data) => {
          if (data.user.id === user.id) {
            setVoiceState(data.voice_state);
          }
        },
      )
        .then(({ unsubscribe }) => {
          voiceStateUnsubscribeRef.current = unsubscribe;
        });
    }
    return () => rpcUnsubscribe();
  }, [rpc, user, voiceState, channelId, rpcUnsubscribe]);

  return voiceState;
}

export function useGuilds(isLoggedIn, rpc) {
  const [guilds, setGuilds] = useState([]);

  useEffect(() => {
    if (isLoggedIn) {
      withRetry(rpc, 'request', RPCCommands.GET_GUILDS)
        .then((data) => setGuilds(data.guilds));
    }
  }, [rpc, isLoggedIn]);

  return guilds;
}

/**
 * Debug hook for getting 'test' text channel Id
 */
export function useTextChannelId(guilds, rpc) {
  const [textChannelId, setTextChannelId] = useState(null);
  useEffect(() => {
    if (guilds.length > 0) {
      // TODO: remove hard-coded guild
      withRetry(rpc, 'request', RPCCommands.GET_CHANNELS, { guild_id: guilds.find((g) => g.name === 'test').id })
        .then(({ channels }) => {
          setTextChannelId(channels.find((c) => c.type === ChannelTypes.GUILD_TEXT).id);
        });
    }
  }, [rpc, guilds]);

  return textChannelId;
}

export function useMessages(textChannelId, rpc) {
  const [messages, setMessages] = useState([]);
  const messagesUnsubscribeRef = useRef(null);
  useEffect(() => {
    if (textChannelId) {
      if (messages.length === 0) {
        withRetry(rpc, 'request', RPCCommands.GET_CHANNEL, { channel_id: textChannelId })
          .then(({ messages: channelMessages }) => {
            setMessages(channelMessages);
          });
      }
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
      }
      withRetry(
        rpc,
        'subscribe',
        RPCEvents.MESSAGE_CREATE,
        { channel_id: textChannelId },
        ({ message }) => setMessages([...messages, message]),
      ).then(({ unsubscribe }) => {
        messagesUnsubscribeRef.current = unsubscribe;
      });
    }
  }, [rpc, messages, textChannelId]);
  return messages;
}
