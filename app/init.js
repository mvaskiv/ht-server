let fs              = require('fs')
let path            = require('path');
const __root        = path.dirname(require.main.filename);

module.exports = function () {
    let folders = [
        __root + '/posters/',
        __root + '/movies/',
        __root + '/covers/'
    ]
    
    folders.forEach(dir => {
        if (!fs.existsSync(dir)){
            console.log(`folder ${dir} --- created`)
            fs.mkdirSync(dir);
        }
    })
}