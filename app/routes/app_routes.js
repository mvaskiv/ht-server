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
            console.log('fs access check --- fs.F_OK --- ' + '/posters/' + m.slug + '.jpg')
            if (err) _savePoster(m.medium_cover_image, m.slug, 'poster')
            else return 1
        })
        fs.access(__root + '/covers/' + m.slug + '.jpg', fs.F_OK, (err) => {
            if (err) _savePoster(m.background_image, m.slug, 'cover')
            else return 1
        })
    })
    return 0
}

function _savePoster(url, name, type) {
    const folder    = type === 'poster' ? '/posters/' : '/covers/'
    let localPath   = __root + folder + name + '.jpg';
    let file        = fs.createWriteStream(localPath);

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
    // app.get('/movies/:sort/:page', (req, res) => {
    //     const page  = req.params.page
    //     const sort  = req.params.sort
    //     const url   = 'https://cors-anywhere.herokuapp.com/https://yts.am/api/v2/list_movies.json?limit=25&sort_by='+sort+'&page='+page;
        
    //     const data = async url => {
    //         try {
    //             const response = await fetch(url, {
    //                 method: 'GET',
    //                 Accept: 'application/json',
                    
    //                 headers: {
    //                     "Content-Type": "application/json; charset=utf-8",
    //                     origin: 'HypoTube',
    //                 },
    //                 timeout: 15000,
    //                 redirect: 'follow',
    //             })
    //             const json = await response.json()
    //             let movies = json.data.movies;
    //             await _checkImages(movies).then((result) => {
    //                 if (result !== 1) res.send(movies)
    //                 else {
    //                     console.log('Setting Timeout --- 3000ms')
    //                     setTimeout(() => res.send(movies), 3000)
    //                 }
    //             })
    //         } catch (error) {
    //             console.error(error)
    //         }
    //     }
    //     data(url);
    // })

    app.get('/stream/:link/:name', async (req, res) => {
        const link      = req.params.link
        const name      = req.params.name
        let return_val  = null

        let engine  = torrentStream('magnet:?xt=urn:btih:'+link+'&dn='+name+'&tr=udp://glotorrents.pw:6969/announce&tr=udp://tracker.opentrackr.org:1337/announce&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80&tr=udp://tracker.coppersurfer.tk:6969&tr=udp://torrent.gresille.org:80/announce&tr=udp://p4p.arenabg.com:1337&tr=udp://tracker.leechers-paradise.org:6969')
        engine.on('ready', function() {
            engine.files.forEach((file) => {
                if (file.name.match(/(^.*\.mp4$)|(^.*\.mkv$)/)) return_val = file
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
            console.log(head)
            
            let vid_stream = return_val.createReadStream({
                start: start,
                end: end
            })

            let lp = __root + '/movies/' + name + '.mp4';

            fs.access(lp, fs.F_OK, (err) => {
                if (!err && fs.statSync(lp).size === v_length) {
                    res.sendFile(lp)
                } else {
                    let file = fs.createWriteStream(lp)
                    res.writeHead(206, head);
                    vid_stream.pipe(res)        
                    vid_stream.pipe(file)
                }
            })
        })
    })

    app.get('/quick-search/:query', (req, res) => {
        console.log('search')
        const query = req.params.query
        const url   = 'https://cors-anywhere.herokuapp.com/https://yts.am/api/v2/list_movies.json?limit=25&page=1&query_term='+query;

        fetch(url, {
            method: 'GET',
            Accept: 'application/json',
            
            headers: {
                "Content-Type": "application/json; charset=utf-8",
                origin: 'HypoTube',
            },
            timeout: 15000,
            redirect: 'follow',
        })
        .then(r => r.json())
        .then(result => {
            let search = result.data.movies
            res.send(search)
        })
        
    })


    app.get('/movies-cache/:sort/:genre/:page', (req, res) => {
        const page  = req.params.page
        const sort  = req.params.sort
        const genre = req.params.genre
        const url   = 'https://cors-anywhere.herokuapp.com/https://yts.am/api/v2/list_movies.json?limit=50&genre='+genre+'&sort_by='+sort+'&page='+page;
        
        
        const upsertPages = async movies => {
            console.log('Upsert started')
            let first = await movies.slice(0, 25);
            let second = await movies.slice(25, movies.length);

            db.collection('pages').update( { page: page, sort: sort, genre: genre }, {page: page, sort: sort, genre: genre, content: JSON.stringify(first)}, {upsert: true}, (err, result) => {
                if (err) {
                    console.warn(`Error: error upserting document: 'Page: ${page}, Sort: ${sort}'\n${err}`)
                } else console.log(`Page upserted: 'Page: ${page}, Sort: ${sort}'`)
            })
            db.collection('pages').update( { page: (parseInt(page) + 1).toString(), sort: sort, genre: genre }, {page: (parseInt(page) + 1).toString(), sort: sort, genre: genre, content: JSON.stringify(second)}, {upsert: true}, (err, result) => {
                if (err) {
                    console.warn(`Error: error upserting document: 'Page: ${page}, Sort: ${sort}'\n${err}`)
                } else console.log(`Page upserted: 'Page: ${(parseInt(page) + 1).toString()}, Sort: ${sort}'`)
            })
        }
     
        const data = async (url, out) => {
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
                let movies = await json.data.movies
                upsertPages(movies)
                // await _checkImages(movies)
                out && res.send(movies.splice(0, 25))
            } catch (error) {
                console.warn(error)
            }
        }

        const dbCheck = async (check, out) => {
            !out && data(url, 0)
            db.collection('pages').findOne({ page: (parseInt(page) + check).toString(), sort: sort, genre: genre }, (err, result) => {
                if (err) {
                    out && res.send({ error: 'error' })
                } else if (!result){
                    data(url, 1)
                } else {
                    out && dbCheck(1, 0)
                    out && res.send(result.content)
                }
            })
        }
        dbCheck(0, 1);
    })
}