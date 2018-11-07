var ObjectID         = require('mongodb').ObjectID
const fetch          = require('node-fetch');
var torrentStream    = require('torrent-stream');

module.exports = function(app, db) {
    app.get('/movies/:page', (req, res) => {
        const page = req.params.page

        const url = 'https://cors-anywhere.herokuapp.com/https://yts.am/api/v2/list_movies.json?limit=30&sort_by=rating&page='+page;
        const data = async url => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    Accept: 'application/json',
                    
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        origin: 'HypoTube',
                    },
                    redirect: 'follow',
                    timeout: 5000,
                })
                const json = await response.json()
                res.send(json.data.movies)
            } catch (error) {
                console.error(error)
            }
        }
        
        data(url);
        
        // db.collection('notes').find( details ).toArray((err, result) => {
        //     if (err) {
        //         res.send({ error: 'xz' })
        //     } else if (!result){
        //         res.send('not_found')
        //     } else {
        //         console.log(req.params.date)
        //         res.send(result)
        //     }
        // })
    })

    

    app.get('/stream/:link/:name', (req, res) => {
        const link  = req.params.link
        const name  = req.params.name
        let return_val  = null

        let engine  = torrentStream('magnet:?xt=urn:btih:'+link+'&dn='+name+'&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce')
        engine.on('ready', function() {
            engine.files.forEach(function(file) {
                console.log('filename:', file.name)
                if (file.name.includes('.mp4')) return_val = file
                // res.send(stream)
            });
            let vid_stream = return_val.createReadStream()
            vid_stream.pipe(res);
        });
    })


    app.get('/note/:id', (req, res) => {
        const id = req.params.id
        const details = { '_id': new ObjectID(id) }
        db.collection('notes').findOne(details, (err, result) => {
            if (err) {
                res.send({ error: 'error' })
            } else if (!result){
                res.send('not_found')
            } else {
                res.send(result)
            }
        })
    })


    app.post('/notes', (req, res) => {
        const note = {
            id: new Date().getTime(),
            header: req.body.header,
            text: req.body.text,
            deleted: req.body.deleted,
            archive: req.body.archive,
            uuid: req.body.uuid,
            last_mod: new Date().getTime()
        }
        db.collection('notes').insert(note, (err, result) => {
            if (err) {
                res.send({ error: 'error' })
            } else {
                res.send(result.ops[0])
            }
        })
    })


    app.delete('/notes/:id', (req, res) => {
        const id = req.params.id
        const details = { '_id': new ObjectID(id) }
        db.collection('notes').remove(details, (err, result) => {
            if (err) {
                res.send({ error: 'error' })
            } else {
                res.send('deleted')
            }
        })
    })

    
    app.put('/notes/:id', (req, res) => {
        const id = req.params.id
        const details = { '_id': new ObjectID(id) }
        const note = { title: req.body.title, text: req.body.text, last_mod: new Date().getTime() }
        db.collection('notes').update(details, note, (err, result) => {
            if (err) {
                res.send({ error: 'xz' })
            } else {
                res.send(note)
            }
        })
    })
}