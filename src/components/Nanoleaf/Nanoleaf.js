import _ from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { DiscordContext } from '../../context/Discord';

const { ipcRenderer } = window.require('electron');

// TODO: make these selectable
const NANOLEAF_SCENES = {
  NOT_IN_CALL: 'Sky Mode',
  NOT_MUTED: 'Discord',
  MUTED: 'Meep',
}

const Nanoleaf = () => {
  const [ready, setReady] = useState(false);
  const [scenes, setScenes] = useState([]);

  useEffect(() => {
    // TODO: allow user to input credentials
    ipcRenderer.invoke('nanoleaf-construct', {
      ipAddress: process.env.REACT_APP_NANOLEAF_IP_ADDRESS,
      authToken: process.env.REACT_APP_NANOLEAF_AUTH_TOKEN,
    }).then(() => setReady(true));
  }, []);
  useEffect(() => {
    ipcRenderer.invoke('nanoleaf-getScenes').then(setScenes)
  }, [ready]);
  const {
    voiceSettings = {},
    voiceChannelId,
  } = useContext(DiscordContext);
  useEffect(() => {
    let scene;
    let icon;
    if (!voiceChannelId) {
      scene = NANOLEAF_SCENES.NOT_IN_CALL;
      icon = null;
    } else if (
      voiceSettings.mute
      || voiceSettings.deaf
      || _.get(voiceSettings, 'mode.type') === 'PUSH_TO_TALK'
    ) {
      scene = NANOLEAF_SCENES.MUTED;
      icon = 'mic_mute';
    } else {
      scene = NANOLEAF_SCENES.NOT_MUTED;
      icon = 'mic';
    }
    console.log('nanoleaf-setScene', scene)
    ipcRenderer.invoke('nanoleaf-setScene', scene);
    ipcRenderer.invoke('electron-icon-overlay', icon);
  }, [voiceSettings, voiceChannelId]);

  return (
    <div>
      <h2>Nanoleaf</h2>
      {scenes.length && (
        <div>
          <h3>Scenes</h3>
          {scenes.map((s) => <p>{s}</p>)}
        </div>
      )}
    </div>
  )
}

export default Nanoleaf;
