let shajs            = require('sha.js')
const uuid           = require('uuid/v4');

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
}