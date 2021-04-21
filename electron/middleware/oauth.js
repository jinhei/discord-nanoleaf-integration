const passport = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const refresh = require('passport-oauth2-refresh');
const _ = require('lodash');
const discord = require('../models/discord');

const app = require('express').Router();

const { DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET } = process.env;

const discordStrategy = new DiscordStrategy(
  {
    clientID: DISCORD_CLIENT_ID,
    clientSecret: DISCORD_CLIENT_SECRET,
    callbackURL: 'http://localhost:5000/api/auth/discord/callback',
    scope: discord.scopes,
  },
  ((accessToken, refreshToken, profile, cb) => {
    console.log('Discord oauth complete', { accessToken, profile });
    _.set(req, 'session.discord.profile', profile);
    profile.refreshToken = refreshToken;
    return cb(err, user);
  }),
);

passport.use(discordStrategy);
refresh.use(discordStrategy);

app
  .use(passport.initialize())
  .use(passport.session())
  .get('/discord', passport.authenticate('discord'))
  .get('/discord/callback',
    passport.authenticate('discord', { failureRedirect: '/login' }),
    (req, res) => {
      console.log('successfully logged in');
      res.redirect('/');
    })
  .get('/discord/refresh', (req, res) => {
    const refreshToken = _.get(req, 'query.refreshToken')
            || _.get(req, 'session.profile.refreshToken');
    if (!refreshToken) {
      return res.send('No refresh token found', 400);
    }
    refresh.requestNewAccessToken('discord',
      profile.refreshToken,
      (err, accessToken, refreshToken) => {
        if (err) {
          console.log('Error refreshing token', err);
          res.sendStatus(err, 500);
          throw err; // boys, we have an error here.
        }

        _.set(req, 'session.discord.profile.accessToken', accessToken); // store this new one for our new requests!
        _.set(req, 'session.discord.profile.refreshToken', refreshToken); // store this new one for our new requests!
        res.sendStatus(201);
      });
  });

module.exports = app;
