/**
 * Discord RPC official documentation: https://discord.js.org/#/docs/rpc/master/general/welcome
 */
import RPCClient from 'discord-rpc/src/client';
import {DISCORD_CLIENT_ID} from '../../config';

class Discord extends RPCClient{

  login() {
    return super.login({
      scopes: ['rpc'],
      clientId: DISCORD_CLIENT_ID,
    });
  }

};

export default Discord;