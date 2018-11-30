const port           = process.env.PORT || 8000;
const ft_uid         = 'd9e37033b880ac3cd0aa360fff1d906ed3f363d681a3acfd4c7c303a369ffbb1'
const ft_sec         = '4367d6db88b636d01372868e543051fc4d2072510fe74f3319406b8eb2669310'

const express        = require('express');
const bodyParser     = require('body-parser');
const MongoClient    = require('mongodb').MongoClient;
const db             = require('./config/db');
const init           = require('./app/init');
const uuid           = require('uuid/v4')
let cors             = require('cors');

let shajs            = require('sha.js')

let path             = require('path')
const https          = require('https')
let fs               = require('fs')

let Cron             = require('cron').CronJob
let cleanUp = new Cron('00 00 12 * * 0-6', () => {
    let now = new Date().getTime()
    fs.readdir('./movies', (err, f) => {
        f.forEach((file, i) => {
            fs.stat('./movies/' + file, (err, stat) => {
                if (err) console.error(err)
                let expiry = new Date(stat.ctime).getTime() + 262974400000
                if (now > expiry) fs.unlink('./movies/' + file)
            })
        })
    })
}, null, true, 'UTC');
cleanUp.start()

let ft_oauth         = require('passport-42').Strategy;
let passport         = require('passport')
    passport.serializeUser(function(user, done) {
        done(null, user);
    });
    
    passport.deserializeUser(function(user, done) {
        done(null, user);
    });
    passport.use(new ft_oauth({
        clientID: ft_uid,
        clientSecret: ft_sec,
        callbackURL: "https://localhost:8443/auth/42/callback"
    },
    async (accessToken, refreshToken, profile, cb) => {
        let auth = {
            fname: profile.name.givenName,
            lname: profile.name.familyName,
            email: profile.emails[0].value,
            login: profile.username
        }
        MongoClient.connect(db.url, (err, database) => {
            if (err) return console.error(err)
            let db_conn = database.db('heroku_tfrwl8td')
            db_conn.collection('users').findOne({'uname':  auth.login}, (err, result) => {
                if (err) {
                    // res.send({ error: 'error' })
                } else if (!result){
                    const id = uuid();
                    const newUser = {
                        uuid: id,
                        fname: auth.fname,
                        lname: auth.lname,
                        email: auth.email,
                        uname: auth.login,
                        upass: 'NULL'
                    }
                    db_conn.collection('users').insert(newUser, (err, result) => {
                        if (err) {
                            // res.send({ error: 'error' })
                        } else {
                            console.log('Registered with 42 as: ' + id);
                            auth.uuid = id
                            return cb(null, auth)
                        }
                    })  
                } else {
                    console.log('Logged in with 42 as: ' + result.uuid);
                    auth.uuid = result.uuid
                    return cb(null, auth)
                }
            })
        })
    }
));

const sendmail       = require('sendmail')({
    logger: {
        debug: console.log,
        info: console.info,
        warn: console.warn,
        error: console.error
    },
    silent: false,
    devHost: 'localhost',
    smtpHost: 'localhost'
})

const app            = express();
      app.use(cors());
      app.use(bodyParser.urlencoded({ extended: true }));
      app.use(bodyParser.json())
      app.use(passport.initialize());
      app.use(passport.session());
      app.use((req, res, next) => {
        res.header('Content-Type: application/javascript')
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    next();
})

const certOptions = {
    key: fs.readFileSync(path.resolve('build/cert/server.key')),
    cert: fs.readFileSync(path.resolve('build/cert/server.crt'))
}

app.get('/', (req, res) => {
    // sendmail({
    //     from: 'no-reply@hypotube.test',
    //     to: 'mike@vaskiv.com',
    //     subject: 'test sendmail',
    //     html: 'Mail of test sendmail ',
    //   }, function(err, reply) {
    //     console.log(err && err.stack);
    //     console.dir(reply);
    // });
    res.send('Hypertube Serving')
})

init()
app.use('/posters/', express.static('posters'))
app.use('/covers/', express.static('covers'))
app.use('/subs/', express.static('subs'))

https.createServer(certOptions, app).listen(8443)

MongoClient.connect(db.url, (err, database) => {
    if (err) return console.error(err)
    let db_conn = database.db('heroku_tfrwl8td') 
    
    require('./app/routes') (app, db_conn)
    app.listen(port, () => {
        console.log(header)
    });
})

const header = '██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ \n██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗\n███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝\n██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗\n██║  ██║   ██║   ██║     ███████╗██║  ██║\n╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝\n                                         \n████████╗██╗   ██╗██████╗ ███████╗       \n╚══██╔══╝██║   ██║██╔══██╗██╔════╝       \n   ██║   ██║   ██║██████╔╝█████╗         \n   ██║   ██║   ██║██╔══██╗██╔══╝         \n   ██║   ╚██████╔╝██████╔╝███████╗       \n   ╚═╝    ╚═════╝ ╚═════╝ ╚══════╝       \n                                         \n'