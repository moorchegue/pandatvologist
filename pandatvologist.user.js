// ==UserScript==
// @name        PandaTVologist
// @author      murchik <murchik+github@protonmail.com>
// @description Panda.tv channel stats (viewers and virtual revenue) collector
// @homepage    http://github.com/moorchegue/pandatvologist
// @match       *://*.panda.tv/*
// @version     0.2.0
// ==/UserScript==

var FOOTER_CONTAINER_CLASS = 'room-foot-hostinfo-container';

var recollection_timeout = 5000;


function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getContainer(container_name) {
    return document.getElementsByClassName(container_name)[0];
}

function getNumByContainer(container_name) {
    return getContainer(container_name).getElementsByClassName('num')[0];
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
    var link = document.createElement('a');
    link.setAttribute('id', args.key);
    link.setAttribute('href', data);
    link.setAttribute('download', args.key + ".csv");
    link.innerHTML = args.key;

    console.log(link);

    var old_link = document.getElementById(args.key);
    if (old_link) {
        old_link.remove();
    }

    var footer = getContainer(FOOTER_CONTAINER_CLASS);
    footer.appendChild(link);
}

function getFromLocalStore(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

function addToLocalStorage(key, data) {
    var stored = getFromLocalStore(key);
    stored.push(data);
    localStorage.setItem(key, JSON.stringify(stored));
    return stored;
}

async function collectStats() {
    var channel = window.location.href.split('/').pop();
    var key = 'panda-' + channel;

    while (true) {
        await sleep(recollection_timeout);

        // HACK Firefox never calls `load` event on a live panda.tv broadcast
        if (!getContainer(FOOTER_CONTAINER_CLASS)) {
            continue;
        }

        var cs = collectCurrentStats();
        console.log(cs);
        var channel_stats = addToLocalStorage(key, cs);

        updateDownloadLink({
            stats: channel_stats,
            key: key,
        });
    }
}

collectStats();
