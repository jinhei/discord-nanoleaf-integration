require('dotenv').config();
const ss = require('screenshot-desktop');
const sharp = require('sharp');
const fs = require('fs');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;
const axios = require('axios');

const COORDS = {
    MUTE_ICON: {
        top: 1337,
        bottom: 1372,
        left: 262,
        right: 297,
    },
    VOICE_CONNECTED: {
        left: 96, 
        top: 1220,
        right: 257, 
        bottom: 1243,
    }
}
const CONTROL_IMGS = {
    VOICE_CONNECTED: 'voice-connected.png',
    USER_MUTED: 'mute-icon.png',
    SERVER_MUTED: 'server-mute-icon.png',
}
const NANOLEAF_SCENES = {
    NOT_IN_CALL: 'Ho Ho Ho',
    NOT_MUTED: 'Discord',
    MUTED: 'Meep',
}
const STATE_FILE = 'state.txt';

async function screenshotDesktops() {
    return ss.all();
}

async function cropImg(img, outputPath, {top, left, right, bottom}) {
    return sharp(img)
        .extract({
            top,
            left,
            width: right - left,
            height: bottom - top,
        })
        .toFile(outputPath)
        .then(() => outputPath);
}

// return ['mute-icon.png', 'server-mute-icon.png'].some(muteImgName => {
const areImgsSame = (imgName1, imgName2) => {
    const img1 = PNG.sync.read(fs.readFileSync(imgName1));
    const img2 = PNG.sync.read(fs.readFileSync(imgName2));
    const {width, height} = img1;
    const diff = new PNG({width, height});
        
    const pixDiff = pixelmatch(img1.data, img2.data, diff.data, width, height, {threshold: 0.1});
    // console.log({pixDiff})
    return pixDiff === 0;
}

const setNanoleafScene = async (sceneName) => {
    // don't set if it's already this state
    if (readState() === sceneName) {
        console.log('Scene already set:', sceneName)
        return;
    }

    console.log(`Setting Nanoleaf scene: ${sceneName}`)
    writeState(sceneName);

    const start = Date.now();
    return axios
        .put(
            `http://${process.env.NANOLEAF_IP_ADDRESS}/api/v1/${process.env.NANOLEAF_AUTH_TOKEN}/effects`,
            {
                'select': sceneName
            }
        )
        .then(({data}) => {
            console.log({data, duration: Date.now() - start})
            return data;
        })
}

const readState = () => {
    try {
        return fs.readFileSync(STATE_FILE)
    } catch (e) {
        console.log('No state to read.');
        return null;
    }
}

const writeState = (state) => {
    fs.writeFileSync(STATE_FILE, state);
}

async function main() {
    const startTime = Date.now();
    const imgs = await screenshotDesktops();
    const filenames = imgs.map((_, i) => `img-${i}.png`);
    let isInCall, isMuted;
    
    // is in call?
    // check if screenshots match voice_connected image
    await Promise.all(imgs.map((img, i) => cropImg(img, filenames[i], COORDS.VOICE_CONNECTED)));
    isInCall = filenames.some(imgName => areImgsSame(imgName, CONTROL_IMGS.VOICE_CONNECTED));
    
    if (isInCall) {
        await Promise.all(imgs.map((img, i) => cropImg(img, filenames[i], COORDS.MUTE_ICON)));
        isMuted = filenames.some(imgName => 
            [CONTROL_IMGS.SERVER_MUTED, CONTROL_IMGS.USER_MUTED].some(controlImgName => 
                areImgsSame(imgName, controlImgName)
            )
        );
        await setNanoleafScene(
            isMuted
                ? NANOLEAF_SCENES.MUTED
                : NANOLEAF_SCENES.NOT_MUTED
        )
    } else {
        await setNanoleafScene(NANOLEAF_SCENES.NOT_IN_CALL);
    }
    console.log(`Ran in ${Date.now() - startTime}ms`);
}

main();