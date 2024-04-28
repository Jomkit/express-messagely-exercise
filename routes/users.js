const express = require("express");
const router = new express.Router();

const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");
const ExpressError = require('../expressError');
const User = require("../models/user");

/** GET / - get list of users.
 * 
 * Logged in users only
 *
 * => {users: [{username, first_name, last_name, phone}, ...]}
 *
 **/
router.get('/', ensureLoggedIn, async (req, res, next) => {
    try{
        const all_users = await User.all();

        return res.json(all_users);

    }catch(e) {
        return next(e);
    }
})


/** GET /:username - get detail of users.
 * 
 * Only the user gets to see their own details
 *
 * => {user: {username, first_name, last_name, phone, join_at, last_login_at}}
 *
 **/
router.get("/:username", ensureCorrectUser, async (req, res, next) => {
    try{
        const ownDetails = await User.get(req.params.username);
        return res.json(ownDetails);

    }catch(e) {
        return next(e);
    }
})

/** GET /:username/to - get messages to user
 * 
 * Only the user gets to see their relevant messages
 *
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 from_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/to", ensureCorrectUser, async (req, res, next) => {
    try{
        const msgsTo = await User.messagesTo(req.params.username);
        
        return res.json({messages: msgsTo});
        
    }catch(e) {
        return next(e);
    }
})

/** GET /:username/from - get messages from user
 *
 * Only the user gets to see their relevant messages
 * 
 * => {messages: [{id,
 *                 body,
 *                 sent_at,
 *                 read_at,
 *                 to_user: {username, first_name, last_name, phone}}, ...]}
 *
 **/
router.get("/:username/from", ensureCorrectUser, async (req, res, next) => {
    try{
        const msgsFrom = await User.messagesFrom(req.params.username);

        return res.json({messages: msgsFrom});
    }catch(e) {
        return next(e);
    }
})

module.exports = router;