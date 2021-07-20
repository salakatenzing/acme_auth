const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require('./db');
const path = require('path');

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});
app.get('/api/users/:token/notes', async (req, res, next) => {
  try {
    const user = await User.byToken(req.params.token)
    // console.log(user)
    const notes = user.notes;
    // console.log(user.username)
    console.log(notes)
    res.status(200).send(notes);
  }catch(err) {
    next(err);
  }
})

app.get('/api/auth', async (req, res, next) => {
  try {
    res.send(await User.byToken(req.headers.authorization));
  } catch (ex) {
    next(ex);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
