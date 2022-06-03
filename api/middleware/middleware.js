const Users = require('../users/users-model')

const checkUsernameUnique = async (req, res, next) =>{
    const { username } = req.body
    const user = await Users.getByUserName(username)

    if(user) {
        next({ status: 401, message: 'username taken'})
    } else {
        next()
    }
}


const checkUsernameExists = async (req, res, next) => {
    const { username } = req.body
    const user = await Users.getByUserName(username)
    if (user) {
        req.user = user
        next()
    } else {
        next({
            status:401,
            message: 'invalid credentials'
        })
    }
}

const checkUserInformation = (req, res, next) => {
    const { username, password } = req.body
    if (!username || !password) {
        next({ status:400, message: 'username and password required'})
    } else {
        next()
    }
}

module.exports = {
    checkUsernameUnique,
    checkUsernameExists,
    checkUserInformation
}