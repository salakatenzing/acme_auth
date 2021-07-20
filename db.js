const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { STRING } = Sequelize;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const secretKey = process.env.JWT;
console.log(process.env.JWT);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});
const Note = conn.define('note', {
  text: STRING
})

Note.belongsTo(User);
User.hasMany(Note);

User.byToken = async (token) => {
  try {
    const data = jwt.verify(token, secretKey);
    const user = await User.findByPk(data.userId, {include: Note});
    // const user = await User.findByPk(token);
    if (user) {
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  const user = await User.findOne({
    where: {
      username,
      // password,
    },
  });
  if (user) {
    if (await bcrypt.compare(password, user.password)) {
      console.log('we are in compare ');
      return jwt.sign({ userId: user.id }, process.env.JWT);
    }
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};

User.beforeCreate(async (user) => {
  const SALT_COUNT = 5;
  const hashedPwd = await bcrypt.hash(user.password, SALT_COUNT);
  user.password = hashedPwd;
});

const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const notes = [
    {text: 'note1'}, {text: 'note2'}, {text: 'note3'}, {text: 'note4'}
  ]
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const [note1, note2, note3, note4] = await Promise.all(
    notes.map((eachNote) => Note.create(eachNote))
  );
  await lucy.setNotes(note1);
  await moe.setNotes([note2, note4]);
  await larry.setNotes(note3);
  return {
    users: {
      lucy,
      moe,
      larry,
    },
    notes: {
      note1,
      note2,
      note3
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  },
};
