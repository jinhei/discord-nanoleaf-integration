# discord-nanoleaf

Runs a server at `localhost:5000` (or SERVER_PORT env) that allows you to control your Nanoleaf IoT lights based on your discord voice status, e.g. `NOT_IN_CALL`, `MUTED`, `NOT_MUTED`. 

## Usage

In your environment, set the following values:

| Key | Value |
| --- | --- |
| DISCORD_CLIENT_ID | Client ID of your [Discord Application](https://discord.com/developers/applications) |
| DISCORD_CLIENT_SECRET | Client secret of the Discord Application |
| NANOLEAF_IP_ADDRESS | Local IP address of your Nanoleaf device, e.g. `192.168.1.3:16021` (default port) |
| NANOLEAF_AUTH_TOKEN | Auth token received from authenticating via [Nanoleaf REST API](https://documenter.getpostman.com/view/1559645/RW1gEcCH#edd41442-c94f-49dc-977b-8180be92e018) |
| SESSION_SECRET | Secret for express session |
| SERVER_PORT | Express server port (default `5000`) |


Run the server and access the page, then press log in. 

## How it works

Using Discord's Oauth2 flow, we use a bearer token to access the Discord RPC API, then grab the voice settings / selected voice channel, then calls the Nanoleaf REST API locally to set the Scene based on the constants set in the [model file](./models/nanoleaf.js).
