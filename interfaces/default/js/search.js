function getCategories() {
    $.ajax({
        url: '/search/getcategories',
        type: 'get',
        dataType: 'json',
        success: function (data) {
            if (data == null) return false;

            var select = $('#catid').html('');
            select.append($('<option>').html('Everything').attr('value','-1'));
            $.each(data.category, function (c, cat) {
                var option = $('<option>').html(cat["@attributes"]["name"]);
                option.attr('value',cat["@attributes"]["id"])
                select.append(option)
                $.each(cat.subcat, function (s, sub) {
                    if (sub["@attributes"] == undefined) sub = cat.subcat;
                    var name = cat["@attributes"]["name"]+'-'+sub["@attributes"]["name"]
                    var option = $('<option>').html('&nbsp;&nbsp;'+name);
                    option.attr('value',sub["@attributes"]["id"])
                    select.append(option)
                });
            });
        }
    });
}

function search(query, catid) {
    if (query==undefined) return;
    $.ajax({
        url: '/search/search?q='+query+'&cat='+catid,
        type: 'get',
        dataType: 'json',
        beforeSend: function () {
            $('#results_table_body').empty();
            $('.spinner').show();
        },
        success: function (data) {
            $('.spinner').hide();
            if (data === null) return
            $.each(data, function (i, item) {
                var attributes = []
                $.each(item.attr, function(a, attr) {
                    var name = attr['@attributes']['name'];
                    var value = attr['@attributes']['value'];
                    attributes[name] = value.replace(/\|/g,', ');
                });
                item.attr = attributes;

                var row = $('<tr>');
                var itemlink = $('<a>').attr('href','#').text(item.description).click(function(){
                    showDetails(item);
                    return false;
                });
                row.append($('<td>').append(itemlink));
                var cat = $('<a>').attr('href','#').text(item.category).click(function(){
                    $('#catid option:contains("'+item.category+'")').attr('selected', 'selected');
                    $('#searchform').submit();
                });
                row.append($('<td>').append(cat));
                row.append($('<td>').addClass('right').html(bytesToSize(item.attr['size'], 2)));

                var toSabIcon = $('<i>');
                toSabIcon.addClass('icon-download-alt');
                toSabIcon.css('cursor', 'pointer');
                toSabIcon.click(function() {
                    sendToSab(item.link)
                });
                row.append($('<td>').append(toSabIcon));

                $('#results_table_body').append(row);
            });
        }
    });
}

function showDetails(data) {
    var modalTitle = "";
    if (data.attr['imdbtitle'])  modalTitle += data.attr['imdbtitle'];
    if (data.attr['imdbyear'])  modalTitle += ' (' + data.attr['imdbyear'] + ')';
    if (data.attr['artist'])  modalTitle += data.attr['artist'];
    if (data.attr['album'])  modalTitle += ' - ' + data.attr['album'];
    if (data.attr['season'])  modalTitle += data.attr['season'];
    if (data.attr['episode'])  modalTitle += data.attr['episode'];
    if (data.attr['tvtitle'])  modalTitle += ' ' + data.attr['tvtitle'];

    var modalImage = '';
    if (data.attr["coverurl"]) {
        modalImage = $('<div>').addClass('thumbnail pull-left');
        modalImage.append($('<img>').attr('src', data.attr["coverurl"]));
    }

    var modalInfo = $('<div>').addClass('modal-movieinfo');
    if(data.attr['imdbtagline']) {
        modalInfo.append($('<p>').html('<b>Tagline:</b> ' + data.attr['imdbtagline']));
    }
    if(data.attr['genre']) {
        modalInfo.append($('<p>').html('<b>Genre:</b> ' + data.attr['genre']));
    }
    if(data.attr['imdbdirector']) {
        modalInfo.append($('<p>').html('<b>Director:</b> ' + data.attr['imdbdirector']));
    }
    if(data.attr['imdbactors']) {
        modalInfo.append($('<p>').html('<b>Actors:</b> ' + data.attr['imdbactors']));
    }
    if(data.attr['imdbscore']) {
        var rating = $('<span>').raty({
            readOnly: true,
            score: (data.attr['imdbscore'] / 2),
        })
        modalInfo.append(rating);
    }
    if(data.attr['label']) {
        modalInfo.append($('<p>').html('<b>Label:</b> ' + data.attr['label']));
    }
    if(data.attr['tracks']) {
        modalInfo.append($('<p>').html('<b>Tracks:</b> ' + data.attr['tracks']));
    }

    var modalBody = $('<div>');
    modalBody.append(modalImage);
    modalBody.append(modalInfo);

    var modalButtons = {
        'Download' : function () {
            sendToSab(data.link)
            hideModal();
        }
    }
    if (data.attr['imdb']) {
        var imdbLink = 'http://www.imdb.com/title/tt' + data.attr['imdb'] + '/';
        $.extend(modalButtons,{
            'IMDb' : function() {
                window.open(imdbLink,'IMDb')
            }
        });
    }

    /*
    if (data.attr['backdropurl']) {
        $('.modal-fanart').css({
            'background' : '#ffffff url('+data.attr['backdropurl']+') top center no-repeat',
            'background-size' : '100%'
        });
    }
    */
    showModal(modalTitle, modalBody, modalButtons);
}

function sendToSab(url) {
    return $.ajax({
        url: '/sabnzbd/AddNzbFromUrl',
        type: 'post',
        dataType: 'json',
        data: {nzb_url: url},
        success: function (result) {
            notify('', 'Sent to SabNZBd', 'info');
        }
    });
}

$(document).ready(function () {
    $('#searchform').submit(function() {
        search($('#query').val(), $('#catid').val());
        return false;
    });
    if ($('#query').val()) $('#searchform').submit();

    getCategories();
});
