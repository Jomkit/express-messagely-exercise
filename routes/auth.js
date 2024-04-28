const express = require('express');
const router = new express.Router();

const jwt = require("jsonwebtoken");

const { SECRET_KEY } = require("../config");

// const { authenticateJWT } = require("../middleware/auth")
const ExpressError = require("../expressError");
const User = require('../models/user');

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/
router.post("/login", async (req, res, next) => {
    try {
        const { username, password } = req.body;
        if(!username || !password) throw new ExpressError("Username and password required", 400);

        // User.authenticate returns true if passwords match
        if(await User.authenticate(username, password)){
            // update last login
            const loggedInAt = await User.updateLoginTimestamp(username);

            const token = jwt.sign({username: username}, SECRET_KEY);
            return res.json({message: `Logged in! At ${loggedInAt.last_login_at}`, token});
        }
        
        
    }catch(e) {
        return next(e);
    }
})

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */
router.post("/register", async (req, res, next) => {
    try{
        const user = await User.register(req.body);
        await User.updateLoginTimestamp(user.username);
        
        const token = jwt.sign({username: user.username}, SECRET_KEY);
        
        return res.json({token});
        
    }catch(e) {
        return next(e);
    }
})

module.exports = router;