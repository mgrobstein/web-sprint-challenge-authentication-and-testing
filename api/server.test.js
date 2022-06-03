const server = require('./server')
const request = require('supertest')
const bcrypt = require('bcrypt')
const db = require ('../data/dbConfig')
const jwt = require('jsonwebtoken')
const { JWT_SECRET } = require('./secrets')

// Write your tests here
test('sanity', () => {
  expect(true).toBe(true)
})

beforeAll(async () => {
  await db.migrate.rollback()
  await db.migrate.latest()
})

beforeEach(async () => {
  await db('users').truncate()
  await db('users').insert ([
    { username: "matthew", password: "d1e8a70b5ccab1dc2f56bbf7e99f064a660c08e361a35751b9c483c88943d082" },
    { username: "matt", password: "$2b$08$v857MDA0vYQmSnpmLxrkYOrksuPL5mA4NZkHpkpVImb.vQL5OjasG" },
    { username: "matty", password: "$2b$08$fdwJ5meWBuX89rzrHuZBYOyYf7YBmHn7WlzyhTjkYddTr6iYX7Vf" }
  ])
})

afterAll(async () => {
  await db.destroy()
})

describe('register enpoint tests', () => {
  describe('POST /register', () => {
    test('If no username or no password or both, fails and message = username and password required', async() =>{
      let res = await request(server).post('/api/auth/register').send({ username: "mateo"})
      expect(res.body.message)
      .toBe('username and password required')
      res = await request(server).post('/api/auth/register').send({ password: "mateo"})
      expect(res.body.message)
      .toBe('username and password required')
      const users = await db('users')
      expect(users).toHaveLength(3)
    })
    test('If username is not unique, fails and includes message = "username taken', async () =>{
      const res = await request(server).post('/api/auth/register').send({ username: "matthew", password: 'matthew'})
      expect(res.body.message).toBe('username taken')
      const users = await db('users')
      expect(users).toHaveLength(3)
    })
    test('Hashed password is saved to database, not plaintext', async () => {
      await request(server).post('/api/auth/register').send({ username: "mateo", password:"mateo"})
      const user = await db('users').where('id', 4).first()
      const password = "mateo"
      const validateUser = bcrypt.compareSync(password, user.password)
      expect(validateUser).toBe(true)
    })
    test('Successfully generates a new user', async () => {
      await request(server).post('/api/auth/register').send({ username: "mateo", password: 'mateo'})
      const users = await db('users')
      const user = await db('users').where('id', 4).first()
      expect(user).toMatchObject({ username: "mateo", id:4})
      expect(users).toHaveLength(4)
    })
  })
})

describe('login endpoint tests', () => {
  describe('POST /login', () => {
    test('If username or password is missing, fails and message = username and password required', async () =>{
    let res = await request(server).post('/api/auth/login').send({ password: "mateo" })
    expect(res.body.message).toBe('username and password required')
    res = await request(server).post('/api/auth/login').send({ username: "mateo" })
    expect(res.body.message).toBe('username and password required')
    })
    test('If password is wrong, message = invalid credentials', async () => {
    const res = await request(server).post('/api/auth/login').send({ username: "mateo", password: "mateo" })
    expect(res.body.message).toBe('invalid credentials')
    })
  })
})

describe('jokes enpoint tests', () => {
  describe('GET /jokes', () => {
    test('if no token, message = token required', async () =>{
    let res = await request(server).get('/api/jokes')
    expect(res.body.message).toBe('token required')
    })
    test('If JWT token invalid, message = token invalid', async () => {
      const res = await request(server).get('/api/jokes').set('Authorization', 'badtoken')
    expect(res.body.message).toBe('token invalid')
    })
    test('If JWT token is valid, get jokes array', async () => {
      await request(server).post('/api/auth/register').send({ username: 'mateo', password: 'mateo'})
      const res = await request(server).post('/api/auth/login').send({ username: 'mateo', password: 'mateo'})
      const { token } = res.body
      const jokes = await request(server).get('/api/jokes').set('Authorization', token)
    expect(jokes.body).toBeInstanceOf(Array)
    expect(jokes.body).toHaveLength(3)
  })
})
})
