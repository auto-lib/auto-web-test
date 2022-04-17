
var log = function() { console.log.apply(console, Array.prototype.slice.call(arguments)) }
let fail = function() {
    let args = Array.prototype.slice.call(arguments);
    args.unshift('FAIL');
    console.log.apply(console, args);
    process.exit(1); }

let get_driver = driver => {

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

let get_boot_data = () => {
    let boot_path = 'boot.js';
    let fs = require('fs');
    if (!fs.existsSync(boot_path)) fail(boot_path,'does not exist');
    return fs.readFileSync(boot_path);
}

let get_server = (driver_data, boot_data) => {

    let fn = (req,res) => {
        log(req.method, req.url);
        if (req.method != 'GET')
        {
            res.writeHead(404);
            res.end('bad method: '+req.method);
            return;
        }
        if (req.url == '/boot.js')
        {
            res.writeHead(200, { 'Content-Type': 'text/javascript' });
            res.end(boot_data);
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
        res.end(driver_data);
    }

    return require('http').createServer(fn);
}

let driver_path = get_driver('tests/example');

log('using '+driver_path+' as driver');

let boot_data = get_boot_data();

let driver_data = require('fs').readFileSync(driver_path);

let server = get_server(driver_data, boot_data);

server.listen(8080);

console.log('listening on 8080');