
const port           = process.env.PORT || 8000;

const express        = require('express');
const bodyParser     = require('body-parser');
const MongoClient    = require('mongodb').MongoClient;
const db             = require('./config/db');

const uuid           = require('uuid/v4');
let cors             = require('cors');

const app            = express();
      app.use(cors());
      app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        next();
})

app.get('/', (req, res) => {
    console.log('qwe')
    res.send('Hypertube Serving')
})

app.use(bodyParser.urlencoded({ extended: true }));
MongoClient.connect(db.url, (err, database) => {
    if (err) return console.error(err)
    let db_conn = database.db('heroku_tfrwl8td') 
    
    require('./app/routes') (app, db_conn)
    app.listen(port, () => {
        console.log(header)
    });
})

const header = '██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ \n██║  ██║╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗\n███████║ ╚████╔╝ ██████╔╝█████╗  ██████╔╝\n██╔══██║  ╚██╔╝  ██╔═══╝ ██╔══╝  ██╔══██╗\n██║  ██║   ██║   ██║     ███████╗██║  ██║\n╚═╝  ╚═╝   ╚═╝   ╚═╝     ╚══════╝╚═╝  ╚═╝\n                                         \n████████╗██╗   ██╗██████╗ ███████╗       \n╚══██╔══╝██║   ██║██╔══██╗██╔════╝       \n   ██║   ██║   ██║██████╔╝█████╗         \n   ██║   ██║   ██║██╔══██╗██╔══╝         \n   ██║   ╚██████╔╝██████╔╝███████╗       \n   ╚═╝    ╚═════╝ ╚═════╝ ╚══════╝       \n                                         \n'
