const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
   client: 'pg',
   connection: {
     host : '127.0.0.1',
     user : 'postgres',
     password : 'test',
     database : 'facerecognition-brain'
   }
 });

// db.select('*').from('users').then(data => {
//    console.log(data)
// })

const app = express();
app.use(bodyParser.json())    // use after const=app has been created. 
app.use(cors())



//______________________________________________________________________
app.get('/', (req, res)=> {
   res.send(database.users)
})

//______________________________________________________________________
app.post('/signin', (req, res) => {
   db.select('email', 'hash').from('login')
      .where('email', '=', req.body.email)
      .then(data => {
         const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
         if (isValid) {
            return db.select('*').from('users')
               .where('email', '=', req.body.email)
               .then(user => {
                  res.json(user[0])
               })
               .catch(err => res.status(400).json('unable to get user'))
         } else {
            res.status(400).json('wrong credentials')
         }
      })
      .catch(err => res.status(400).json('wrong credentials'))
})

//______________________________________________________________________
app.post('/register', (req, res) => {
   const { email, name, password } = req.body;
   const hash = bcrypt.hashSync(password);
      db.transaction(trx => {
         trx.insert({
            hash: hash,
            email: email
         })
         .into('login')
         .returning('email')
         .then(loginEmail => {
            return trx('users')
            .returning('*')
            .insert({
               email: loginEmail[0],
               name: name,
               joined: new Date()
            })
            .then(user => {
               res.json(user[0])
            })
         })
         .then(trx.commit)
         .catch(trx.rollback)
      })
      .catch(err => res.status(400).json('unable to register'))
})

//______________________________________________________________________
app.get('/profile/:id', (req, res) => {
   const { id } = req.params;
   db.select('*').from('users').where({id})
      .then(user => {
         if (user.length) {
            res.json(user[0])
         } else {
            res.status(400).json('not found')
         }
      })
      .catch(err => res.status(400).json('error getting user'))
})

//______________________________________________________________________
app.put('/image', (req, res) => {
   const { id } = req.body;
   db('users').where('id', '=', id)
   .increment('entries', 1)
   .returning('entries')
   .then(entries => {
      res.json(entries[0])
   })
   .catch(err => res.status(400).json('unable to get entries'))
})
////////////////////////////////////////////////////////////////////////


// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//    // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//    // res = false
// });
// 
// bcrypt.hash(password, null, null, function(err, hash) {
//    // Store hash in your password DB.
//    console.log(hash)
// });
////////////////////////////////////////////////////////////////////////
app.listen(3000, ()=> {
   console.log('app is running test, on port 3000')
})


/** 
 * 
 * / --> res = this is working
 * /signin --> POST = success/fail
 * /register --> POST = user
 * /profile/:userId --> GET = user
 * /image --> PUT --> user
 * 
 **/