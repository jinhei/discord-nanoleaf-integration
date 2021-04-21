const app = require('express')();
const path = require('path');
const discord = require('../models/discord');

app
  .use('/login', (req, res) => {
    // use session's access token if we have it, bypassing oauth
    if (req.session.access_token) {
      return res.redirect(`/discord/callback?access_token=${req.session.access_token}`);
    }
    res.redirect(discord.getOauthUrl({
      redirectUri: 'http://localhost:5000/discord/sso/callback',
    }));
  })
  .get('/sso/callback', (req, res) => {
    res.sendFile(path.resolve(
      __dirname,
      '../public/callback.html',
    ));
  })
  .get('/callback', async (req, res) => {
    try {
      const {
        access_token: accessToken,
        expires_in: expiresIn,
      } = req.query;
      // discord callback has expires_in, while our bypass does not
      if (expiresIn) {
        req.session.access_token = accessToken;
        req.session.cookie.expires = Date.now() + expiresIn - 5000;
      }
      await discord.login({ accessToken });
      res.redirect('/?loggedInStatus=true');
    } catch (e) {
      console.log('Discord callback error', e);
      res.status(500).send({ ...e });
    }
  });

module.exports = app;
