/**
 * Discord RPC official documentation:
 *   https://discord.com/developers/docs/topics/rpc
 * discord-rpc JS documentation is non-existent -- use source code instead:
 *   https://github.com/discordjs/RPC/tree/master
 */
import { createContext, useRef } from 'react';
import { useConnected, useGuilds, useUser, useVoiceChannelId, useVoiceSettings, useVoiceState } from '../hooks/discord';
// require from electron to access nodejs 'net'
const DiscordRPC = window.require('discord-rpc');

export const DiscordContext = createContext(null);

DiscordRPC.register(process.env.REACT_APP_DISCORD_CLIENT_ID);

export const DiscordProvider = ({ children }) => {
  const { current: rpc } = useRef(new DiscordRPC.Client({ transport: 'ipc' }));
  const [user, login] = useUser(rpc);
  const isLoggedIn = !!user;
  const voiceChannelId = useVoiceChannelId(isLoggedIn, rpc);

  const value = {
    isConnected: useConnected(rpc),
    login,
    user,
    voiceChannelId,
    voiceSettings: useVoiceSettings(voiceChannelId, rpc),
    voiceState: useVoiceState(voiceChannelId, rpc),
    guilds: useGuilds(isLoggedIn, rpc),
  };
  console.log('::: context', value);

  const { Provider } = DiscordContext;
  return (
    <Provider
      value={value}
    >
      {children}
    </Provider>
  );
};
