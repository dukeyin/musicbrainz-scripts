'use strict';
var meta = function() {
// ==UserScript==
// @name         MusicBrainz: Replace recording artists from a Work page
// @namespace    mbz-loujine
// @author       loujine
// @version      2015.11.09
// @downloadURL  https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/mbz-showperformers.user.js
// @updateURL    https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/mbz-showperformers.user.js
// @supportURL   https://bitbucket.org/loujine/musicbrainz-scripts
// @icon         https://bitbucket.org/loujine/musicbrainz-scripts/raw/default/icon.png
// @description  musicbrainz.org: Show performers & replace associated recording artst from a Work page
// @compatible   firefox+greasemonkey
// @licence      CC BY-NC-SA 3.0 (https://creativecommons.org/licenses/by-nc-sa/3.0/)
// @require      https://greasyfork.org/scripts/13707-musicbrainz-common-files-for-the-sidebar/code/MusicBrainz:%20common%20files%20for%20the%20sidebar.js?version=85769
// @require      https://greasyfork.org/scripts/13747-musicbrainz-common-files/code/MusicBrainz:%20common%20files.js?version=85994
// @include      http*://*musicbrainz.org/work/*
// @exclude      http*://*musicbrainz.org/work/*/*
// @grant        none
// @run-at       document-end
// ==/UserScript==
};
if (meta && meta.toString && (meta = meta.toString())) {
    var meta = {'name': meta.match(/@name\s+(.+)/)[1],
                'version': meta.match(/@version\s+(.+)/)[1]};
}

// imported from mbz-loujine-common.js: requestGET, mbzTimeout,
// formatPerformers, replaceArtist

function showPerformers() {
    var composer = $('th:contains("composer:")').parent().find('a').attr('href').split('/')[4],
        $rows = $('table.tbl a[href*="/artist/' + composer + '"]').parents('tr');
    $rows = $($rows.get().reverse()); // FIXME whyis jquery reversing the list?
    $('thead > tr').append('<th>Performer AR</th>');
    $('.subh > th')[1].colSpan += 1;

    $rows.each(function (idx, tr) {
        setTimeout(function () {
            var mbid = $(tr).find('a[href*="/recording/"]').attr('href').split('/')[4],
                artist = $(tr).find('a[href*="/artist/"]').attr('href').split('/')[4],
                url = '/ws/2/recording/' + encodeURIComponent(mbid) + '?fmt=json&inc=artist-rels';
            requestGET(url, function (response) {
                var resp = JSON.parse(response),
                    $node,
                    $button;
                if (resp.relations.length) {
                    $node = $('<td>' + formatPerformers(resp.relations) + '</td>');
                    $button = $('<input></input>', {
                        'id': 'replace-' + mbid,
                        'class': 'replace',
                        'type': 'checkbox',
                        'value': 'Replace artist'
                    });
                    $node.append($button);
                } else {
                    $node = $('<td>✗</td>').css('background-color', 'red');
                }
                $(tr).append($node);
            });
        }, idx * mbzTimeout);
    });
}

// imported from mbz-loujine-sidebar.js: container
$container
    .append(
        $('<h3>Show performers</h3>')
    )
    .append(
        $('<input></input>', {
          'id': 'showperformers',
          'type': 'button',
          'value': 'Show performer AR'
        })
    )
    .append(
        $('<h3>Replace artists</h3>')
    )
    .append(
        $('<p>First click "Show performer AR" then check boxes to select artists</p>')
    )
    .append(
        $('<p>Edit note:</p>')
    )
    .append(
        $('<textarea></textarea>', {'id': 'batch_replace_edit_note',
                                    'text': sidebarEditNote(meta)})
    )
    .append(
        $('<input></input>', {
          'id': 'batch_replace',
          'type': 'button',
          'disabled': true,
          'value': 'Replace selected artists'
          })
    );

$(document).ready(function() {
    $('#showperformers').click(function() {
        showPerformers();
        $('#batch_replace').prop('disabled', false);
    });
    $('#batch_replace').click(function() {replaceArtist();});
    return false;
});
