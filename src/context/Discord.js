/**
 * Discord RPC official documentation: 
 *   https://discord.com/developers/docs/topics/rpc
 * discord-rpc JS documentation is non-existent -- use source code instead: 
 *   https://github.com/discordjs/RPC/tree/master
 */
import {ChannelTypes, RPCCommands, RPCEvents} from 'discord-rpc/src/constants';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Logger from '../helpers/logger';
// require from electron to access nodejs 'net'
const DiscordRPC = window.require('discord-rpc');

export const DiscordContext = React.createContext(null);

const logger = new Logger({name: 'discord'});

DiscordRPC.register(process.env.REACT_APP_DISCORD_CLIENT_ID);

export const DiscordProvider = ({children}) => {
  const {current: rpc} = useRef(new DiscordRPC.Client({transport: 'ipc'}));

  const [isConnected, setConnected] = useState();
  useEffect(() => {
    ['connected', 'ready'].forEach(e => {
      rpc.on(e, data => {
        logger.log(e.toUpperCase(), data);
        setConnected(true);
      });
    });

    ['close', 'disconnected', 'error'].forEach(e => {
      rpc.on(e, data => {
        logger.log(e.toUpperCase(), data);
        setConnected(false);
      });
    });
  }, [rpc]);

  // login
  const [user, setUser] = useState(null);
  const login = useCallback(() => 
    rpc
      .login({
        scopes: ['rpc', 'messages.read'],
        // TODO: user inputs their client id/secret?
        clientId: process.env.REACT_APP_DISCORD_CLIENT_ID,
        clientSecret: process.env.REACT_APP_DISCORD_CLIENT_SECRET,
        redirectUri: 'http://localhost:5000/api/auth/discord/callback'
      })
      .then(data => {
        logger.log('LOGIN', data);
        setUser(rpc.user);
        return data;
      })
      .catch(e => {
        logger.error('LOGIN error', e);
        throw e;
      }),
    [rpc, setUser]
  );

  // channel ID
  const [channelId, setChannelId] = useState(null);
  useEffect(() => {
    if (user) {
      rpc.request(RPCCommands.GET_SELECTED_VOICE_CHANNEL)
        .then(data => {
          logger.log('::::: GET_SELECTED_VOICE_CHANNEL', data);
          setChannelId(data && (data.id || data.channel_id) || null);
        })
        .catch(e => console.log('::::: e', e));
      
      logger.log('Subscribe: VOICE_CHANNEL_SELECT');
      rpc.subscribe(RPCEvents.VOICE_CHANNEL_SELECT, data => {
        logger.log('VOICE_CHANNEL_SELECT', data);
        setChannelId(data.channel_id || null);
      })
        .then(data => {
          logger.log('VOICE_CHANNEL_SELECT subscribe success', data);
        })
        .catch(e => console.log('::::: e', e));
      // logger.log('Subscribe: CHANNEL_CREATE');
      // rpc.subscribe(RPCEvents.CHANNEL_CREATE, data => {
      //   logger.log('CHANNEL_CREATE', data);
      //   setChannelId(data.channel_id || null);
      // })
      //   .then(data => {
      //     logger.log('CHANNEL_CREATE subscribe success', data);
      //   });
    }
  }, [user, rpc]);

  // voice settings
  const [voiceSettings, setVoiceSettings] = useState();
  const voiceSettingsUnsubscribeRef = useRef(null);
  useEffect(() => {
    if (voiceSettingsUnsubscribeRef.current) {
      logger.log('unsubscribe: VOICE_STATE_UPDATE');
      voiceSettingsUnsubscribeRef.current();
    }
    if (channelId) {
      rpc.request(
        RPCCommands.GET_VOICE_SETTINGS, 
      ).then(setVoiceSettings);
      logger.log('Subscribe: VOICE_SETTINGS_UPDATE');
      rpc.subscribe(
        RPCEvents.VOICE_SETTINGS_UPDATE, 
        data => {
          console.log('VOICE_SETTINGS_UPDATE', data);
          setVoiceSettings(data);
        }
      )
        .then(({unsubscribe}) => {
          logger.log('Subscribe success', RPCEvents.VOICE_SETTINGS_UPDATE, unsubscribe);
          voiceSettingsUnsubscribeRef.current = unsubscribe;
        });
    }
  }, [rpc, channelId]);

  // voice state
  const [voiceState, setVoiceState] = useState();
  const voiceStateUnsubscribeRef = useRef(null);
  useEffect(() => {
    if (voiceStateUnsubscribeRef.current) {
      logger.log('unsubscribe: VOICE_STATE_UPDATE');
      voiceStateUnsubscribeRef.current();
    }
    if (channelId) {
      logger.log('Subscribe: VOICE_STATE_UPDATE');
      rpc.subscribe(
        RPCEvents.VOICE_STATE_UPDATE, 
        {channel_id: channelId}, 
        data => {
          console.log('VOICE_STATE_UPDATE', data);
          setVoiceState(data);
        }
      )
        .then(({unsubscribe}) => voiceStateUnsubscribeRef.current = unsubscribe);
    }
  }, [rpc, channelId]);

  const [guilds, setGuilds] = useState([]);
  useEffect(() => {
    if (user) {
      rpc.request(RPCCommands.GET_GUILDS)
        .then(data => setGuilds(data.guilds));
    }
  }, [rpc, user]);
  
  const [textChannelId, setTextChannelId] = useState(null);
  useEffect(() => {
    if (guilds.length > 0) {
      // TODO: remove hard-coded guild
      rpc.request(RPCCommands.GET_CHANNELS, {guild_id: guilds.find(g => g.name === 'test').id})
        .then(({channels}) => 
          setTextChannelId(channels.find(c => c.type === ChannelTypes.GUILD_TEXT).id)
        );
    }
  }, [rpc, guilds]);

  const [messages, setMessages] = useState([]);
  const messagesUnsubscribeRef = useRef(null);
  useEffect(() => {
    if (textChannelId) {
      if (messages.length === 0) {
        rpc.request(RPCCommands.GET_CHANNEL, {channel_id: textChannelId})
          .then(({messages}) => setMessages(messages));
      }
      messagesUnsubscribeRef.current && messagesUnsubscribeRef.current();
      rpc.subscribe(
        RPCEvents.MESSAGE_CREATE, 
        {channel_id: textChannelId},
        ({message}) => setMessages([...messages, message])
      ).then(({unsubscribe}) => {
        messagesUnsubscribeRef.current = unsubscribe;
      });
    }
  }, [rpc, messages, textChannelId]);

  const value = {
    isConnected,
    login,
    user,
    channelId,
    voiceSettings,
    voiceState,
    guilds,
    messages
  };
  console.log('::: context', value);

  const {Provider} = DiscordContext;
  return (
    <Provider 
      value={value}
    >
      {children}
    </Provider>
  );
};
