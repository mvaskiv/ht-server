
const port           = process.env.PORT || 8000;

const express        = require('express');
const bodyParser     = require('body-parser');
const MongoClient    = require('mongodb').MongoClient;
const db             = require('./config/db');
const init           = require('./app/init');
let cors             = require('cors');

let path             = require('path')
const https          = require('https')
let fs               = require('fs')



const certOptions = {
    key: fs.readFileSync(path.resolve('build/cert/server.key')),
    cert: fs.readFileSync(path.resolve('build/cert/server.crt'))
}

const app            = express();
      app.use(cors());
      app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        next();
})
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json())

https.createServer(certOptions, app).listen(8443)

app.get('/', (req, res) => {
    res.send('Hypertube Serving')
})

init()
app.use('/posters/', express.static('posters'))
app.use('/covers/', express.static('covers'))

MongoClient.connect(db.url, (err, database) => {
    if (err) return console.error(err)
    let db_conn = database.db('heroku_tfrwl8td') 
    
    require('./app/routes') (app, db_conn)
    app.listen(port, () => {
        console.log(header)
    });
})

const header = '██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ \n██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗\n███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝\n██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗\n██║  ██║   ██║   ██║     ███████╗██║  ██║\n╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝\n                                         \n████████╗██╗   ██╗██████╗ ███████╗       \n╚══██╔══╝██║   ██║██╔══██╗██╔════╝       \n   ██║   ██║   ██║██████╔╝█████╗         \n   ██║   ██║   ██║██╔══██╗██╔══╝         \n   ██║   ╚██████╔╝██████╔╝███████╗       \n   ╚═╝    ╚═════╝ ╚═════╝ ╚══════╝       \n                                         \n'