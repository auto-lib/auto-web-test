
let fail = msg => { console.log('FAIL',msg); process.exit(1); }
var log = function() { console.log.apply(console, Array.prototype.slice.call(arguments)) }

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

let driver_path = get_driver('tests/example');

log('using '+driver_path+' as driver');