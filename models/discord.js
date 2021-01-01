const DiscordRPC = require('discord-rpc');
const nanoleaf = require('./nanoleaf');

const {DISCORD_CLIENT_ID: clientId} = process.env;
const scopes = ['rpc'];
module.exports.scopes = scopes;

DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });

rpc.on('ready', () => {
    console.log('Discord RPC Ready', rpc.user)
    pollVoiceState();
});

module.exports.getOauthUrl = ({
    redirectUri
}) => `https://discord.com/oauth2/authorize?response_type=token&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${escape(redirectUri)}`;

let isLoggedIn = false;
module.exports.login = ({
    accessToken
}) => {
    if (isLoggedIn) {
        return true;
    }
    return rpc
        .login({ 
            clientId, 
            scopes, 
            accessToken, 
        })
        .then(() => {
            isLoggedIn = true;
        })
        .catch(e => {
            console.error('Discord login error', e);
            throw e;
        });
}

const pollVoiceState = () => setInterval(
    async () => {
        const [
            {
                mute,
                mode: {
                    type,
                }
            },
            selectedChannel,
        ] = await Promise.all([
            rpc.getVoiceSettings(),
            rpc.request('GET_SELECTED_VOICE_CHANNEL')
        ]);
        nanoleaf.setScene(
            !selectedChannel
                ? nanoleaf.SCENES.NOT_IN_CALL
                : mute 
                    ? nanoleaf.SCENES.MUTED
                    : nanoleaf.SCENES.NOT_MUTED
        );
    },
    1000
)
