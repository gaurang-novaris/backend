import express from 'express';
import mongoose, { Error } from 'mongoose';
import dotenv from "dotenv";
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import User from './User';
import { IMongoDBUser } from './types'
const GoogleStrategy = require('passport-google-oauth20').Strategy;



dotenv.config();

const app = express();

mongoose.connect("mongodb+srv://user:IJBiWYCS2wh6kwxE@cluster0.fyfkv0j.mongodb.net/test?retryWrites=true&w=majority", {
}, () => {
  console.log("Connected to mongoose successfully");
});

// Middleware
app.use(express.json());
app.use(cors({ origin: "https://demo.novaris.ai", credentials: true }));


app.use(
  session({
    secret: "secretcode",
    resave: true,
    saveUninitialized: true,
}));


app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser((user: IMongoDBUser, done: any) => {
  return done(null, user._id);
});

passport.deserializeUser((id: string, done: any) => {

  User.findById(id, (err: Error, doc: IMongoDBUser) => {
    // Whatever we return goes to the client and binds to the req.user property
    return done(null, doc);
  })
})


passport.use(new GoogleStrategy({
  clientID: `${process.env.GOOGLE_CLIENT_ID}`,
  clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
  callbackURL: "/auth/google/callback"
},
  function (_: any, __: any, profile: any, cb: any) {

    User.findOne({ googleId: profile.id }, async (err: Error, doc: IMongoDBUser) => {

      if (err) {
        return cb(err, null);
      }

      if (!doc) {
        const newUser = new User({
          googleId: profile.id,
          username: profile.name.givenName
        });

        await newUser.save();
        cb(null, newUser);
      } else cb(null, doc);
    })

  }));

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: 'https://demo.novaris.ai', session: true }),
  function (req, res) {
    res.redirect('https://demo.novaris.ai');
  });

app.get("/", (req, res) => {
  res.send("Helllo WOlrd");
})

app.get("/getuser", (req, res) => {
  res.send(req.user);
})

app.get("/auth/logout", (req, res) => {
  if (req.user) {
    req.logout();
    res.send("done");
  }
})

app.listen(process.env.PORT || 4000, () => {
  console.log("Server Starrted");
})
