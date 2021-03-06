'use strict';

const fs = require('fs');
const path = require('path');

const suncalc = require('suncalc');
const moment = require('moment');

const Feeder = require('./lib/feeder');
const Tweeter = require('./lib/tweeter');
const video = require('./lib/video');

const config = fs.existsSync('./local.config.js') ?
    require('./local.config.js') :
    require('./config.js');

const T = new Tweeter(config.twitterAPI);

const bot = () => {

    const start = moment();

    // const start = moment({
    //     year: 2016,
    //     month: 2,
    //     day: 2,
    //     hour: 12,
    //     minute: 15
    // });

    const sun = suncalc.getTimes(start.toDate(), 42.66, -8.11);

    const midPhase = start.set('hour', start.hour() - 1).set('minute', 0);

    const sunrise = moment(sun.sunrise);
    const sunset = moment(sun.sunset);

    let tweetText = 'As últimas 2 horas de Galicia vista dende o espazo';

    if (midPhase > sunrise && midPhase < sunset) {

        if (midPhase.subtract(1, 'hour') < sunrise) {
            tweetText = 'Bos días! xa é un novo día en Vila Pingüín!';
        }

        if (midPhase.add(2, 'hour') > sunset) {
            tweetText = 'Estase facendo de noite, non haberá máis imaxes ata mañá pola mañá';
        }

        const satelliteFeed = new Feeder(moment(), config.imagesPath, 24, config);

        satelliteFeed.getSeries()
            .then(() => video(config.imagesPath + '/%d.jpg', path.join(__dirname, 'current.mp4')))
            .then(video => {
                satelliteFeed.clean();
                return T.tweetVideo(tweetText, video);
            })
            .then(id => process.stdout.write(id))
            .catch(error => {
                process.stderr.write(error.message);
            });
    }

};

bot();
