const uuid = require('uuid/v4');
var ObjectID = require('mongodb').ObjectID

module.exports = function(app, db) {
    // app.get('/notes/:id', (req, res) => {
    //     const id = req.params.id
    //     const details = { 'uuid': id }
    //     db.collection('notes').find( details ).toArray((err, result) => {
    //         if (err) {
    //             res.send({ error: 'xz' })
    //         } else if (!result){
    //             res.send('not_found')
    //         } else {
    //             console.log(result)
    //             res.send('qwe')
    //         }
    //     })
    // })
    // app.get('/note/:id', (req, res) => {
    //     const id = req.params.id
    //     const details = { '_id': new ObjectID(id) }
    //     db.collection('notes').findOne(details, (err, result) => {
    //         if (err) {
    //             res.send({ error: 'xz' })
    //         } else if (!result){
    //             res.send('not_found')
    //         } else {
    //             res.send(result)
    //         }
    //     })
    // })


    app.post('/init', (req, res) => {
        const id = uuid();
        db.collection('uuids').insert({ uuid: id }, (err, result) => {
            if (err) {
                res.send({ error: 'error' })
            } else {
                console.log('registered as: ' + id);
                res.send({uuid: id})
            }
        })  
    })

    app.post('/sync', (req, res) => {
        db.collection('uuids').findOne({'uuid':  req.body.uuid}, (err, result) => {
            if (err) {
                res.send({ error: 'error' })
            } else if (!result) {
                console.log('not_found');
                res.send({ error: 'uuid' })
            } else {
                console.log('found, uuid: ' + req.body.uuid);
                // console.log(JSON.parse(req.body[0]));
                let feedback = []
                let timestamp = new Date().getTime()
                for (let key in req.body) {
                    if (key !== 'uuid') {
                        let obj = JSON.parse(req.body[key])
                        obj.uuid = req.body.uuid
                        obj.last_mod = timestamp
                        db.collection('notes').update( { id: obj.id, uuid: obj.uuid }, obj, {upsert: true}, (err, result) => {
                            if (err) {
                                res.send({ error: 'xz' })
                            } 
                        })
                    }
                }
                res.send(feedback);
            }
        })
    })
}