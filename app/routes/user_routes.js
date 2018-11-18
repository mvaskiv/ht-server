let shajs            = require('sha.js')
const uuid           = require('uuid/v4')
const fetch          = require('node-fetch');
let url              = require('url')

const ft_uid         = 'd9e37033b880ac3cd0aa360fff1d906ed3f363d681a3acfd4c7c303a369ffbb1'
const ft_sec         = '4367d6db88b636d01372868e543051fc4d2072510fe74f3319406b8eb2669310'

let ft_oauth         = require('passport-42').Strategy;
let passport         = require('passport')

passport.use(new ft_oauth({
    clientID: ft_uid,
    clientSecret: ft_sec,
    callbackURL: "https://localhost:8443/auth/42/callback"
  },
  async (accessToken, refreshToken, profile, cb) => {
    //   console.log(profile)
      let user = {
          fname: profile.name.givenName,
          lname: profile.name.familyName,
          email: profile.emails[0].value,
          login: profile.username
      }
      console.log(user);
      return user

    // User.findOrCreate({ fortytwoId: profile.id }, function (err, user) {
    //   return cb(err, user);
    // });
  }
));

module.exports = function(app, db) {
    app.get('/user/:id', (req, res) => {
        let uuid = req.params.id;

        db.collection('users').findOne({uuid: uuid}, (err, result) => {
            if (err) res.send({error: 'error'})
            else res.send({status: 'ok', data: result})
        })
    })

    app.put('/user/:id', (req, res) => {
        let uuid = req.params.id;
        let auth = req.body.auth.split('.')

        if (auth[1] === shajs('sha256').update(uuid.toString()).digest('hex')) {
            db.collection('users').findOne({uuid: uuid}, (err, result) => {
                if (err) res.send({error: 'error'})
                else res.send({status: 'ok', me: result})
            })
        } else res.send({error: 'no_permission'})
    })

    app.post('/user/:id', (req, res) => {
        let uuid = req.params.id;
        let auth = req.body.auth ? req.body.auth.split('.') : null;

        if (auth && auth[1] === shajs('sha256').update(uuid.toString()).digest('hex')) {
            db.collection('users').findOne({uuid: uuid}, (err, result) => {
                console.log(result)
                if (err) res.send({error: 'error'})
                else if (!result) res.send({rejection: 'logout'})
                else res.send({status: 'ok', me: result})
            })
        } else res.send({error: 'no_permission'})
    })

    app.post('/login', async (req, res) => {
        let moment = new Date().getTime();

        db.collection('users').findOne({'uname': req.body.uname, 'upass': shajs('sha256').update(req.body.upass.toString()).digest('hex')}, (err, result) => {
            if (err) res.send({rejection: 'error'})
            else if (!result) res.send({ error: 'not_found' })
            else {
                let JWT = shajs('sha256').update(moment.toString()).digest('hex') + '.' + shajs('sha256', 'hypertube').update(result.uuid).digest('hex')
                res.send({status: 'login', auth: JWT, uuid: result.uuid})
            }
        })
    })

    app.post('/register', (req, res) => {
        db.collection('users').findOne({ $or: [{'uname':  req.body.uname}, {'email': req.body.email}]}, (err, result) => {
            if (err) {
                res.send({rejection: 'error'})
            } else if (!result) {
                let data = req.body
                data.uuid = uuid();
                data.upass = shajs('sha256').update(req.body.upass.toString()).digest('hex')
                db.collection('users').insert(data, (err, result) => {
                    if (err) res.send({ error: 'error' })
                    else res.send({ status: 'registered'})
                })  
            } else {
                res.send({rejection: 'exists'})
            }
        })
    })

    app.delete('/user/:id', (req, res) => {
        let uuid = req.params.id;
        let auth = req.body.auth.split('.')

        if (auth[1] === shajs('sha256').update(uuid.toString()).digest('hex')) {
            db.collection('users').findOne({uuid: uuid}, (err, result) => {
                if (err) res.send({error: 'error'})
                else res.send({status: 'ok', me: result})
            })
        } else res.send({error: 'no_permission'})
    })

    app.get('/oauth', (req, res) => {
        let code = req.query.code;
        let url     = `https://api.intra.42.fr/oauth/token?grant_type=client_credentials&client_id=${ft_uid}&client_secret=${ft_sec}&code=${code}`
        fetch(url, {
            method: 'POST',
            headers: {
                Accept: 'application/json',
            }     
        }).then(r => r.json())
        .then(result => {
            console.log(result)
            res.send(result);
        })
    })

    app.get('/42/:addr/:token', (req, res) => {
        let token   = req.params.token;
        let addr    = req.params.addr
        let url     = 'https://api.intra.42.fr/v2/' + addr;

        fetch(url, {
            method: 'GET',
            headers: {
                Accept: 'application/json',
                'Authorization': 'Bearer ' + token,
            }
        }).then(r => r.json()).then(result => res.send(result))
    })


    app.get('/auth/42', passport.authenticate('42'));

    app.get('/auth/42/callback',
        passport.authenticate('42', { failureRedirect: '/login' }),
        function(req, res) {
            // Successful authentication, redirect home.
            res.redirect('/');
    });
}