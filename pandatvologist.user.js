// ==UserScript==
// @name        PandaTVologist
// @author      murchik <murchik+github@protonmail.com>
// @description Panda.tv channel stats (viewers and virtual revenue) collector
// @homepage    http://github.com/moorchegue/pandatvologist
// @match       *://*.panda.tv/*
// @version     0.1.0
// ==/UserScript==

var recollection_timeout = 5000;
var stats = [];

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getNumByContainer(container_name) {
    var container = document.getElementsByClassName(container_name)[0];
    return container.getElementsByClassName('num')[0];
}

function getBamboo() {
    return Number(getNumByContainer('room-bamboo-num').getAttribute('data-num'));
}

function getViewers() {
    return Number(getNumByContainer('room-viewer-num').innerHTML.replace(',', ''));
}

function collectCurrentStats() {
    return {
        'time': new Date().toJSON(),
        'viewers': getViewers(),
        'bamboo': getBamboo(),
    };
}

function convertArrayOfObjectsToCSV(args) {
    var result, ctr, keys, columnDelimiter, lineDelimiter, data;

    data = args.data || null;
    if (data === null || !data.length) {
        return null;
    }

    columnDelimiter = args.columnDelimiter || ',';
    lineDelimiter = args.lineDelimiter || '\n';

    keys = Object.keys(data[0]);

    result = '';
    result += keys.join(columnDelimiter);
    result += lineDelimiter;

    data.forEach(function(item) {
        ctr = 0;
        keys.forEach(function(key) {
            if (ctr > 0) result += columnDelimiter;

            result += item[key];
            ctr++;
        });
        result += lineDelimiter;
    });

    return result;
}

function updateDownloadLink(args) {
    var csv = convertArrayOfObjectsToCSV({data: args.stats});

    if (csv && !csv.match(/^data:text\/csv/i)) {
        csv = 'data:text/csv;charset=utf-8,' + csv;
    }
    var data = encodeURI(csv);
    var channel = window.location.href.split('/').pop();
    var today = new Date().toJSON().split('T')[0];
    var link_id = 'panda-' + channel + '-' + today;
    var link = document.createElement('a');
    link.setAttribute('id', link_id);
    link.setAttribute('href', data);
    link.setAttribute('download', link_id + ".csv");
    link.innerHTML = link_id;

    console.log(link);

    var old_link = document.getElementById(link_id);
    if (old_link) {
        old_link.remove();
    }

    var footer = document.getElementsByClassName('room-foot-hostinfo-container')[0];
    footer.appendChild(link);
}

async function collectStats() {
    while (true) {
        var cs = collectCurrentStats();
        console.log(cs);
        stats.push(cs);
        updateDownloadLink({stats: stats});
        await sleep(recollection_timeout);
    }
}

window.addEventListener('load', function() {
    collectStats();
}, false);
