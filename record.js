
var log = function() { console.log.apply(console, Array.prototype.slice.call(arguments)) }
let fail = function() {
    let args = Array.prototype.slice.call(arguments);
    args.unshift('FAIL');
    console.log.apply(console, args);
    process.exit(1); }

let get_driver_path = driver => {

    let fs = require('fs');

    if (!fs.existsSync(driver)) fail(driver+'/ not found');
    if (!fs.lstatSync(driver)) fail(driver+' is not directory');

    let driver_path;
    if (fs.existsSync(driver+'/driver.html')) driver_path = driver + '/driver.html';
    if (fs.existsSync(driver+'/index.html')) driver_path = driver + '/index.html';

    if (!driver_path) 
        fs.readdirSync(driver).forEach(file => {
            if (file.indexOf('.html')>-1)
            {
                if (driver_path) fail('more than one html file found in '+driver+': '+driver_path+' and '+file);
                driver_path = file;
            }
        })

    if (!driver_path) fail('could not find an html file in '+driver);

    return driver_path;
}

let get_server = (base_path, driver_data) => {

    let fn = (req,res) => {

        let fs = require('fs');
        log(req.method, req.url);
        if (req.method != 'GET')
        {
            res.writeHead(404);
            res.end('bad method: '+req.method);
            return;
        }
        if (req.url != '/' && fs.existsSync(base_path+req.url))
        {
            var extname = require('path').extname(base_path+req.url);
            var contentType = 'text/html';
            switch (extname) {
                case '.html':
                    contentType = 'text/html';
                case '.js':
                    contentType = 'text/javascript';
                    break;
                case '.css':
                    contentType = 'text/css';
                    break;
                case '.json':
                    contentType = 'application/json';
                    break;
            }
            if (!contentType)
            {
                log('unknown content type:',base_path+req.url);
                res.writeHead(404);
                res.end('unknown content type:',base_path+req.url());
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(fs.readFileSync(base_path+req.url));
            return;
        }
        if (req.url != '/' && req.url != '/index.html')
        {
            log('bad url: '+req.url);
            res.writeHead(404);
            res.end('bad url: '+req.url);
            return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(fs.readFileSync(driver_path));
    }

    return require('http').createServer(fn);
}

let base_path = 'tests/example'
let driver_path = get_driver_path(base_path);

log('using '+driver_path+' as driver');

let server = get_server(base_path, driver_path);

server.listen(8080);

console.log('listening on 8080');