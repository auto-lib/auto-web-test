
let { get_driver_path, log, get_server } = require('./util');

let test_path = 'tests/example'
let driver_path = get_driver_path(test_path);

log('using '+driver_path+' as driver');

let server = get_server(test_path, driver_path);

server.listen(8080);

log('listening on 8080');