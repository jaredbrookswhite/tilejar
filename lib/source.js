var _ = require('underscore');
var tm = require('./tm');
var Bridge = require('tilelive-bridge');
var tilelive = require('tilelive');

var cache = {};

module.exports = source;
tilelive.protocols['pgsource:'] = source;
tilelive.protocols['pgtiles:'] = source;

function source(arg, callback) {
    var s = _.where(tm.pg_sources.rows, {source_name:arg.host}); 
    if (s.length > 0) {
        var sourceType = arg.href.split('//')[0];
        if (cache[arg.host]) return callback(null, cache[arg.host]);
        switch (sourceType) {
            /*case 'pgtiles:':
                // todo: connect to pg_vector_tiles after update
                //new MBTiles(tm._config.geo_data + arg.host, callback);
                break;*/
            default :
                var opts = {};
                opts.id = arg.host;
                opts.xml = s[0].markup;
                source.refresh(opts, callback);
                break;
        }
    }
    else
        callback(new Error('Source Not Defined'));
}

// Load or refresh the relevant source using specified data + xml.
source.refresh = function(rawdata, callback) {
    var id = rawdata.id;
    var uri = tm.parse(rawdata.id);
    var opts = {};
    opts.xml = rawdata.xml;
    opts.base = uri.dirname;
    new Bridge(opts, loaded);
    function loaded(err, p) {
        if (err) return callback(err);
        cache[id] = cache[id] || p;
        cache[id].xml = rawdata.xml;
        callback(null, cache[id]);
    }
};

// Set or get tile serving errors.
source.error = function(id, err) {
    if (!cache[id]) return false;
    cache[id].errors = cache[id].errors || [];
    if (err && cache[id].errors.indexOf(err.message) === -1) {
        cache[id].errors.push(err.message);
    }
    return cache[id].errors;
};