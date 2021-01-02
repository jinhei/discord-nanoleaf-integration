const DiscordRPC = require('discord-rpc');
const _ = require('lodash');
const nanoleaf = require('./nanoleaf');

const {DISCORD_CLIENT_ID: clientId} = process.env;
const scopes = ['rpc'];
module.exports.scopes = scopes;

const keyMap = strArr => _.zipObject(strArr, strArr);
const VOICE_MODES = keyMap([
    'PUSH_TO_TALK',
]);
const RPC_REQUESTS = keyMap([
    'GET_SELECTED_VOICE_CHANNEL'
])

DiscordRPC.register(clientId);

const rpc = new DiscordRPC.Client({ transport: 'ipc' });
let interval;

rpc.on('ready', () => {
    console.log('Discord RPC Ready', rpc.user)
    interval = pollVoiceState();
});

rpc.on('close', () => {
    console.log('Discord RPC closed');
    clearInterval(interval);
    isLoggedIn = false;
}) 

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
            rpc.request(RPC_REQUESTS.GET_SELECTED_VOICE_CHANNEL)
        ]);

        nanoleaf.setScene(
            !selectedChannel
                ? nanoleaf.SCENES.NOT_IN_CALL
                : mute || type === VOICE_MODES.PUSH_TO_TALK
                    ? nanoleaf.SCENES.MUTED
                    : nanoleaf.SCENES.NOT_MUTED
        );
    },
    1000
)
