const express = require("express");
const router = new express.Router();

const { ensureLoggedIn, ensureCorrectUser } = require("../middleware/auth");

const Message = require("../models/message");
const ExpressError = require("../expressError");

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/
router.get("/:id", ensureLoggedIn, async (req, res, next) => {
    try{
        const msg = await Message.get(req.params.id);
        console.log(msg.to_user.username);
        console.log(req.user.username);
        // current logged-in user must be either to or from
        if(msg.from_user.username == req.user.username || 
            msg.to_user.username == req.user.username){
                
                return res.json(msg);
            }
        throw new ExpressError("Unauthorized to view message", 401);

    }catch(e) {
        return next(e);
    }
})


/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/
router.post("/", ensureLoggedIn, async (req, res, next) => {
    try{
        const fromUser = req.user.username;
        const { to_username, body } = req.body;
        // console.log("From:", fromUser, "To:", to_username, "Body:", body);
        const newMessage = await Message.create({from_username: fromUser, to_username: to_username, body: body});
        return res.json({message: newMessage});
    }catch(e) {
        return next(e);
    }
})


/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/
router.post("/:id/read", ensureLoggedIn, async (req, res, next) => {
    try{
        const msgId = req.params.id;
        const msg = await Message.get(msgId);
        if(req.user.username == msg.to_user.username) {
            await Message.markRead(msgId);
            return res.json({message: "Message read"});
        }
        throw new ExpressError("Unauthorized Markread", 401);
    }catch(e) {
        return next(e);
    }
})

module.exports = router;