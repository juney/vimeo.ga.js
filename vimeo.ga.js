/*!
 * vimeo.ga.js | v0.2
 * Copyright (c) 2012 - 2013 Sander Heilbron (http://sanderheilbron.nl)
 * MIT licensed
 */

$(function() {
    var f = $('iframe'),
        url = f.attr('src').split('?')[0], // source URL
        protocol = document.URL.split(':')[0], // domain protocol (http or https)
        trackProgress = f.data('progress'), // Data attribute to enable progress tracking
        trackSeeking = f.data('seek'); // Data attribute to enable seek tracking

    // match protocol with what is in document.URL
    if (url.match(/^http/) === null) {
        url = protocol + ':' + url;
    }
    
    // Listen for messages from the player
    if (window.addEventListener) {
        window.addEventListener('message', onMessageReceived, false);
    } else {
        window.attachEvent('onmessage', onMessageReceived, false);
    }

    // Handle messages received from the player
    function onMessageReceived(e) {
        if (e.origin !== "http://player.vimeo.com") {
            return;
        }
        var data = JSON.parse(e.data);

        switch (data.event) {
            case 'ready':
                onReady();
                break;

            case 'playProgress':
                onPlayProgress(data.data);
                break;

            case 'seek':
                if (trackSeeking && !videoSeeking) {
                    ga('send', 'event', 'vimeo', 'skipped video forward or backward', url, undefined, true);
                    videoSeeking = true; // Avoid subsequent seek trackings
                }
                break;

            case 'play':
                if (!videoPlayed) {
                    ga('send', 'event', 'vimeo', 'started video', url, undefined, true);
                    videoPlayed = true; //  Avoid subsequent play trackings
                }
                break;

            case 'pause':
                onPause();
                break;

            case 'finish':
                if (!videoCompleted) {
                    ga('send', 'event', 'vimeo', 'completed video', url, undefined, true);
                    videoCompleted = true; // Avoid subsequent finish trackings
                }
                break;
        }
    }

    // Helper function for sending a message to the player
    function post(action, value) {
        var data = {
            method: action
        };

        if (value) {
            data.value = value;
        }

        f[0].contentWindow.postMessage(JSON.stringify(data), url);
    }

    function onReady() {
        post('addEventListener', 'play');
        post('addEventListener', 'seek');
        post('addEventListener', 'pause');
        post('addEventListener', 'finish');
        post('addEventListener', 'playProgress');
        progress25 = false;
        progress50 = false;
        progress75 = false;
        videoPlayed = false;
        videoPaused = false;
        videoSeeking = false;
        videoCompleted = false;
    }

    function onPause() {
        if (timePercentComplete < 99 && !videoPaused) {
            ga('send', 'event', 'vimeo', 'paused video', url, undefined, true);
            videoPaused = true; // Avoid subsequent pause trackings
        }
    }

    // Tracking video progress
    function onPlayProgress(data) {
        timePercentComplete = Math.round((data.percent) * 100); // Round to a whole number

        if (!trackProgress) {
            return;
        }

        var progress;

        if (timePercentComplete > 24 && !progress25) {
            progress = 'played video: 25%';
            progress25 = true;
        }

        if (timePercentComplete > 49 && !progress50) {
            progress = 'played video: 50%';
            progress50 = true;
        }

        if (timePercentComplete > 74 && !progress75) {
            progress = 'played video: 75%';
            progress75 = true;
        }

        if (progress) {
            ga('send', 'event', 'vimeo', progress, url, undefined, true);
        }
    }

});