// This Source Code Form is subject to the terms of the GNU General Public
// License, version 3. If a copy of the GPL was not distributed with this file,
// You can obtain one at https://www.gnu.org/licenses/gpl.txt.
var bunyan = require('bunyan');
var fs = require('fs');
var path = require('path');

var log = bunyan.createLogger({name: "terren.se"});

var ExtensionToContentType = {
    'html': 'text/html',
    'js': 'application/javascript'
};
function StaticFile(filename) {
    this.filename = filename;
    this.contentType = ExtensionToContentType[path.extname(filename)];
    if (this.contentType === undefined)
        this.contentType = 'text/plain';
}
StaticFile.prototype.get = function (request, response) {
    fs.readFile(this.filename, function (err, data) {
        if (err) {
            log.error(err);
            return;
        }

        response.writeHead(200, {
            'Content-Type': this.contentType + "; charset=utf-8",
            'Content-Length': data.length,
            'Content-Encoding': 'plain'
        });
        response.write(data);
        response.end();
    });
};

function JsonBlob(data) {
    this.json = JSON.stringify(data);
}
JsonBlob.prototype.get = function(request, response) {
    response.writeHead(200, {'Content-Type': 'text/json', 'Content-Length': this.json.length});
    response.write(this.json);
    response.end();
};

module.exports = {
    'StaticFile': StaticFile,
    'JsonBlob': JsonBlob
};