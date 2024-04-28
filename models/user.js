/** User class for message.ly */
const db = require('../db');
const ExpressError = require('../expressError');
const bcrypt = require('bcrypt');
const { BCRYPT_WORK_FACTOR } = require('../config');

/** User of the site. */

class User {
  // constructor (username, password, first_name, last_name, phone){
  //   this.username = username;
  //   this.password = password;
  //   this.first_name = first_name;
  //   this.last_name = last_name;
  //   this.phone = phone;
  // }

  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({username, password, first_name, last_name, phone}) { 
    //hash the password for security
    const hashedPw = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    const currDate = new Date();
    
    const result = await db.query(
      `INSERT INTO users (username, password, first_name, last_name, phone, join_at)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING username, password, first_name, last_name, phone, join_at, last_login_at`,
      [username, hashedPw, first_name, last_name, phone, currDate]
    );
    return result.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) { 
    const result = await db.query(`
    SELECT username, password
    FROM users
    WHERE username=$1`, 
    [username])
    const user = result.rows[0];
    if(user){
      // Compare entered password to database hashedPW
      if(await bcrypt.compare(password, user.password)){
        return true;
      }else {
        return false;
      }
    }
    // If user not found
    throw new ExpressError("Invalid username/password", 400);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) { 
    const last_login = new Date();
    
    const result = await db.query(`
    UPDATE users
    SET last_login_at = $2
    WHERE username = $1
    RETURNING last_login_at`,
    [username, last_login])

    return result.rows[0];
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() { 
    const results = await db.query(`
    SELECT username, first_name, last_name, phone
    FROM users`);

    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) { 
    const result = await db.query(`
    SELECT username, first_name, last_name, phone, join_at, last_login_at
    FROM users
    WHERE username=$1`,
    [username]);
    if(result){
      return result.rows[0];
    }
    // if username not found
    throw new ExpressError("User not found", 400);
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) { 
    const results = await db.query(
    `
    SELECT m.id,
            u.username, u.first_name, u.last_name, u.phone,
           m.body,
           m.sent_at,
           m.read_at
    FROM messages m
    JOIN users u ON u.username = m.to_username
    WHERE m.from_username=$1`,
    [username]);
    const messages = results.rows;
    return  messages.map(m => (
      {
        id: m.id,
        to_user: {
          username: m.username,
          first_name: m.first_name,
          last_name: m.last_name,
          phone: m.phone
        },
        body: m.body,
        sent_at: m.sent_at,
        read_at: m.read_at
      }
    ));      
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesTo(username) { 
    
    const results = await db.query(
      `
      SELECT m.id,
              u.username, u.first_name, u.last_name, u.phone,
             m.body,
             m.sent_at,
             m.read_at
      FROM messages m
      JOIN users u ON u.username = m.from_username
      WHERE m.to_username=$1`,
      [username]);
      const messages = results.rows;
      return  messages.map(m => (
        {
          id: m.id,
          from_user: {
            username: m.username,
            first_name: m.first_name,
            last_name: m.last_name,
            phone: m.phone
          },
          body: m.body,
          sent_at: m.sent_at,
          read_at: m.read_at
        }
      ));      
  }
}


module.exports = User;