var ObjectID         = require('mongodb').ObjectID
const fetch          = require('node-fetch');
var torrentStream    = require('torrent-stream');
const https          = require('https')
let fs               = require('fs')
let path             = require('path');
const __root         = path.dirname(require.main.filename);

async function _checkImages(movies) {
    await movies.forEach(m => {
        fs.access(__root + '/posters/' + m.slug + '.jpg', fs.F_OK, (err) => {
            if (err) _savePoster(m.medium_cover_image, m.slug, 'poster')
        })
        fs.access(__root + '/covers/' + m.slug + '.jpg', fs.F_OK, (err) => {
            if (err) _savePoster(m.background_image, m.slug, 'cover')
        })
    })
    return 1
}

function _savePoster(url, name, type) {
    const folder = type === 'poster' ? '/posters/' : '/covers/'
    let localPath = __root + folder + name + '.jpg';
    let file = fs.createWriteStream(localPath);

    https.get({
        method: 'GET',
        host: 'cors-anywhere.herokuapp.com',
        path: '/' + url,
        headers: {
            origin: 'HypoTube',
        },
    }, async r => {
        r.pipe(file);
    });
}

module.exports = function(app, db) {
    app.get('/movies/:sort/:page', (req, res) => {
        const page = req.params.page
        const sort = req.params.sort
        const url = 'https://cors-anywhere.herokuapp.com/https://yts.am/api/v2/list_movies.json?limit=12&sort_by='+sort+'&page='+page;
        
        const data = async url => {
            try {
                const response = await fetch(url, {
                    method: 'GET',
                    Accept: 'application/json',
                    
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                        origin: 'HypoTube',
                    },
                    timeout: 15000,
                    redirect: 'follow',
                })
                const json = await response.json()
                let movies = json.data.movies;
                _checkImages(movies).then(() => res.send(movies))
            } catch (error) {
                console.error(error)
            }
        }
        
        data(url);
    })

    app.get('/stream/:link/:name', async (req, res) => {
        const link  = req.params.link
        const name  = req.params.name
        let return_val  = null

        let engine  = torrentStream('magnet:?xt=urn:btih:'+link+'&dn='+name+'&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce')
        engine.on('ready', function() {
            engine.files.forEach((file) => {
                if (file.name.includes('.mp4')) return_val = file
            });

            let se = req.headers.range.replace(/bytes=/, '').split('-');
            let start = parseInt(se[0], 10);
            let end = se[1] ? parseInt(se[1], 10) : return_val.length - 1;
            let v_length = (end - start) + 1
            let head = {
                "Content-Range": "bytes " + start + "-" + end + "/" + return_val.length,
                "Accept-Ranges": "bytes",
                "Content-Length": v_length,
                "Content-Type": "video/mp4"
            }
            console.log(head);
            res.writeHead(206, head);

            let vid_stream = return_val.createReadStream({
                start: start,
                end: end
            })
            vid_stream.pipe(res)
        });
    }) 

    // app.get('/poster/:name', (req, res) => {
    //     const name = req.params.name + '.jpg'
    //     res.sendFile(__dirname + '/posters/' + name);
    // })
}