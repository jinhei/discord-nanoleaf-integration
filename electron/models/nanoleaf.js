const axios = require('axios');

const {
  NANOLEAF_IP_ADDRESS,
  NANOLEAF_AUTH_TOKEN,
} = process.env; // TODO: get this from electron

const NANOLEAF_SCENES = {
  NOT_IN_CALL: 'Ho Ho Ho',
  NOT_MUTED: 'Discord',
  MUTED: 'Meep',
};

let lastScene;
const setNanoleafScene = async (sceneName) => {
  // don't set if it's already this state
  if (lastScene === sceneName) {
    return;
  }

  console.log(`Setting Nanoleaf scene: ${sceneName}`);
  lastScene = sceneName;

  const start = Date.now();
  return axios
    .put(
      `http://${NANOLEAF_IP_ADDRESS}/api/v1/${NANOLEAF_AUTH_TOKEN}/effects`,
      {
        select: sceneName,
      },
    )
    .then(({ data }) => {
      console.log({ data, duration: Date.now() - start });
      return data;
    });
};
module.exports.setScene = setNanoleafScene;
module.exports.SCENES = NANOLEAF_SCENES;
