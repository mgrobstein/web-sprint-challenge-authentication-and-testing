const router = require('express').Router();
const Users = require('../users/users-model')
const bcrypt = require('bcrypt')

const jwt= require('jsonwebtoken')
const { JWT_SECRET } = require("../secrets"); // use this secret!

const { checkUsernameExists, checkUsernameUnique, checkUserInformation } = require('../middleware/middleware');
// const bodyparser = require('body-parser')

// router.use(bodyparser.urlencoded({extended:true}))
router.post('/register',  checkUserInformation, checkUsernameUnique, async (req, res) => {
  const { username, password } = req.body
  const hash = bcrypt.hashSync(password, 8)
  const user = { username, password: hash}

  try{
    const newUser = await Users.create(user)
    res.status(201).json(newUser)
  } catch(error) {
    next(error)
  }
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
});

router.post('/login', checkUserInformation, checkUsernameExists, (req, res) => {
  const validateUser = bcrypt.compareSync(req.body.password, req.user.password)
  const token = buildToken(req.user)
  if (validateUser) {
    res.status(200).json({
      message: `welcome, ${req.user.username}`,
      token,
    })
  } else {
    next({
      status: 401,
      message: "invalid credentials"
    })
  }
});

function buildToken(user) {
  const payload = {
    subject: user.id,
    username: user.username
  }
  const options = {
    expiresIn: '1d'
  }
  return jwt.sign(payload, JWT_SECRET, options)
}

module.exports = router;
