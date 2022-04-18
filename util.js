
var log = function() { 
    
    console.log.apply(console, Array.prototype.slice.call(arguments)) 
}

let fail = function() {

    let args = Array.prototype.slice.call(arguments);
    args.unshift('FAIL');
    console.log.apply(console, args);
    process.exit(1); 
}

// get primary html from the test path
let get_driver_path = test_path => {

    let fs = require('fs');

    if (!fs.existsSync(test_path)) fail(test_path+'/ not found');
    if (!fs.lstatSync(test_path)) fail(test_path+' is not directory');

    let driver_path;
    if (fs.existsSync(test_path+'/driver.html')) driver_path = test_path + '/driver.html';
    if (fs.existsSync(test_path+'/index.html')) driver_path = test_path + '/index.html';

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

let get_server = (test_path, driver_path) => {

    let fn = (req,res) => {

        let fs = require('fs');
        log(req.method, req.url);
        if (req.method != 'GET')
        {
            res.writeHead(404);
            res.end('bad method: '+req.method);
            return;
        }
        if (req.url != '/' && fs.existsSync(test_path+req.url))
        {
            var extname = require('path').extname(test_path+req.url);
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
                log('unknown content type:',test_path+req.url);
                res.writeHead(404);
                res.end('unknown content type:',test_path+req.url());
            }
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(fs.readFileSync(test_path+req.url));
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

module.exports = { log, fail, get_driver_path, get_server };