/**
 * Discord RPC official documentation: 
 *   https://discord.com/developers/docs/topics/rpc
 * discord-rpc JS documentation is non-existent -- use source code instead: 
 *   https://github.com/discordjs/RPC/tree/master
 */
import {RPCCommands, RPCEvents} from 'discord-rpc/src/constants';
import _ from 'lodash';
import { useEffect, useRef, useState } from 'react';
import Logger from '../helpers/logger';

// require from electron to access nodejs 'net'
const DiscordRPC = window.require('discord-rpc');

const logger = new Logger({name: 'discord'});

DiscordRPC.register(process.env.REACT_APP_DISCORD_CLIENT_ID);
const rpc = new DiscordRPC.Client({transport: 'ipc'});
logger.log('Created', rpc);

const login = () => 
  rpc
    .login({
      scopes: ['rpc'],
      clientId: process.env.REACT_APP_DISCORD_CLIENT_ID,
    })
    .then(data => {
      logger.log('LOGIN', data);
      return data;
    })
    .catch(e => {
      logger.error('LOGIN error', e);
      throw e;
    });

export function useLogin() {
  const [isLoggedIn, setLoggedIn] = useState(rpc.user);
  return [
    isLoggedIn, 
    isLoggedIn 
      ? _.noop
      : () => login()
        .then(data => {
          // setLoggedIn(true);
          console.log('::: setting loggedin', rpc.user);
          setLoggedIn(rpc.user);
        })
  ];
}

export function useConnected() {
  const [isConnected, setConnected] = useState(false);
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
  }, []);

  return isConnected;
}

export function useChannel() {
  const [channelId, setChannel] = useState(null);
  const [isReady, login] = useLogin();
  console.log(':::', {isReady, login});

  useEffect(() => {
    if (isReady) {
      rpc.request(RPCCommands.GET_SELECTED_VOICE_CHANNEL)
        .then(data => setChannel(data.channel_id || null));
      logger.log('Subscribe: VOICE_CHANNEL_SELECT');
      rpc.subscribe(RPCEvents.VOICE_CHANNEL_SELECT, data => {
        logger.log('VOICE_CHANNEL_SELECT', data);
        setChannel(data.channel_id || null);
      });
    }
  }, [isReady]);

  return channelId;
}

export function useVoiceSettings() {
  const [voiceSettings, setVoiceSettings] = useState({});
  const channelId = useChannel();
  const unsubscribeRef = useRef(null);
  const [isReady, login] = useLogin();
  console.log(':::2', {isReady, login});

  useEffect(() => {
    if (unsubscribeRef.current) {
      logger.log('unsubscribe: VOICE_STATE_UPDATE');
      unsubscribeRef.current();
    }
    if (channelId) {
      logger.log('Subscribe: VOICE_STATE_UPDATE');
      rpc.subscribe(
        RPCEvents.VOICE_STATE_UPDATE, 
        {channel_id: channelId}, 
        data => {
          console.log('VOICE_STATE_UPDATE', data);
          setVoiceSettings(data);
        }
      )
        .then(({unsubscribe}) => unsubscribeRef.current = unsubscribe);
    }
  }, [channelId]);

  return voiceSettings;
}
