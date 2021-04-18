/**
 * Discord RPC official documentation: 
 *   https://discord.com/developers/docs/topics/rpc
 * discord-rpc JS documentation is non-existent -- use source code instead: 
 *   https://github.com/discordjs/RPC/tree/master
 */
import DiscordRPC from 'discord-rpc';
import {RPCEvents} from 'discord-rpc/src/constants';
import { useEffect, useState } from 'react';
import Logger from '../helpers/logger';

const logger = new Logger({name: 'discord'});
const rpc = new DiscordRPC.Client({transport: 'websocket'});
logger.log('Created', rpc);

export function login() {
  return rpc
    .login({
      scopes: ['rpc'],
      clientId: process.env.REACT_APP_DISCORD_CLIENT_ID,
      accessToken: 'OspQFXdVr9S8eYTU3bmywq6RalOaiY'
    })
    .then(data => {
      logger.log('LOGIN', data);
      return data;
    })
    .catch(e => {
      logger.error('LOGIN error', e);
      throw e;
    });
}

export function useConnected() {
  const [isConnected, setConnected] = useState(false);
  useEffect(() => {
    ['ready', 'connected'].forEach(e => {
      rpc.on(e, data => {
        console.log(e.toUpperCase(), data);
        setConnected(true);
      });
    });

    ['close', 'disconnected', 'error'].forEach(e => {
      rpc.on(e, data => {
        console.log(e.toUpperCase(), data);
        setConnected(false);
      });
    });
  }, []);

  return isConnected;
}

export function useChannel() {
  const [channelId, setChannelId] = useState(null);
  useEffect(() => {
    rpc.subscribe(RPCEvents.CHANNEL_CREATE, data => {
      logger.log('CHANNEL_CREATE', data);
      setChannelId(data.channelId || null);
    });
  }, []);

  return channelId;
}

export function useVoiceSettings() {
  const [voiceSettings, setVoiceSettings] = useState({});
  useEffect(() => {
    rpc.subscribe(RPCEvents.VOICE_STATE_UPDATE, data => {
      console.log('VOICE_STATE_UPDATE', data);
      setVoiceSettings(data);
    });
  }, []);

  return voiceSettings;
}
