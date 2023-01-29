import _ from 'lodash';
import cx from 'classnames';

import React, { useContext, useEffect, useState } from 'react';
import { DiscordContext } from '../../context/Discord';

const { ipcRenderer } = window.require('electron');

const LOCALSTORAGE_KEYS = {
  IP: 'nanoleaf-ip',
  AUTH_TOKEN: 'nanoleaf-authtoken',
  NOT_IN_CALL: 'scene-not-in-call',
  NOT_MUTED: 'scene-not-muted',
  MUTED: 'scene-muted',
};
const NANOLEAF_SCENES = {
  NOT_IN_CALL: localStorage.getItem(LOCALSTORAGE_KEYS.NOT_IN_CALL) || 'Sky Mode',
  NOT_MUTED: localStorage.getItem(LOCALSTORAGE_KEYS.NOT_MUTED) || 'Discord',
  MUTED: localStorage.getItem(LOCALSTORAGE_KEYS.MUTED) || 'Meep',
};

const Nanoleaf = () => {
  const [ready, setReady] = useState(false);
  const [scenes, setScenes] = useState([]);
  const [muteScene, setMuteSceneState] = useState(NANOLEAF_SCENES.MUTED);
  const [unmuteScene, setUnmuteSceneState] = useState(NANOLEAF_SCENES.NOT_MUTED);
  const [defaultScene, setDefaultSceneState] = useState(NANOLEAF_SCENES.NOT_IN_CALL);
  const [ipAddress, setIp] = useState(
    localStorage.getItem(LOCALSTORAGE_KEYS.IP)
    || process.env.REACT_APP_NANOLEAF_IP_ADDRESS,
  );
  const [authToken, setAuthToken] = useState(
    localStorage.getItem(LOCALSTORAGE_KEYS.AUTH_TOKEN)
    || process.env.REACT_APP_NANOLEAF_AUTH_TOKEN,
  );

  const setMuteScene = (val) => {
    localStorage.setItem(LOCALSTORAGE_KEYS.MUTED, val);
    setMuteSceneState(val);
  };
  const setUnmuteScene = (val) => {
    localStorage.setItem(LOCALSTORAGE_KEYS.NOT_MUTED, val);
    setUnmuteSceneState(val);
  }
  const setDefaultScene = (val) => {
    localStorage.setItem(LOCALSTORAGE_KEYS.NOT_IN_CALL, val);
    setDefaultSceneState(val);
  };

  const [selectionFn, setSelectionFn] = useState(null);

  useEffect(() => {
    localStorage.setItem(LOCALSTORAGE_KEYS.IP, ipAddress);
    localStorage.setItem(LOCALSTORAGE_KEYS.AUTH_TOKEN, authToken);
    setReady(false);
    // TODO: allow user to input credentials
    ipcRenderer.invoke('nanoleaf-construct', {
      ipAddress,
      authToken,
    }).then(() => setReady(true));
  }, [ipAddress, authToken]);
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
      scene = defaultScene;
      icon = null;
    } else if (
      voiceSettings.mute
      || voiceSettings.deaf
      || _.get(voiceSettings, 'mode.type') === 'PUSH_TO_TALK'
    ) {
      scene = muteScene;
      icon = 'mic_mute';
    } else {
      scene = unmuteScene;
      icon = 'mic';
    }
    ipcRenderer.invoke('nanoleaf-setScene', scene);
    ipcRenderer.invoke('electron-icon-overlay', icon);
  }, [defaultScene, muteScene, unmuteScene, voiceSettings, voiceChannelId]);

  return (
    <div>
      <h2>Nanoleaf</h2>
      <Input label="Nanoleaf IP" onSubmit={(val) => setIp(val)} value={ipAddress} />
      <Input label="Auth Token" onSubmit={(val) => setAuthToken(val)} value={authToken} />
      <Table>
        <thead>
          <Row>
            <Data th>Condition</Data>
            <Data th>Scene</Data>
          </Row>
        </thead>
        <tbody>
          <Row
            selected={selectionFn === setDefaultScene}
            onClick={() => setSelectionFn(() => setDefaultScene)}>
            <Data>Default</Data>
            <Data>{defaultScene}</Data>
          </Row>
          <Row
            selected={selectionFn === setUnmuteScene}
            onClick={() => setSelectionFn(() => setUnmuteScene)}>
            <Data>Speaking</Data>
            <Data>{unmuteScene}</Data>
          </Row>
          <Row
            selected={selectionFn === setMuteScene}
            onClick={() => setSelectionFn(() => setMuteScene)}>
            <Data>Muted</Data>
            <Data>{muteScene}</Data>
          </Row>
        </tbody>
      </Table>
      {scenes.length && (
        <div>
          <h3>Scenes</h3>
          <div className="flex flex-wrap">
            {scenes.map((s) => (
              <Button
                key={s}
                onClick={selectionFn
                  ? () => {
                    selectionFn(s);
                    setSelectionFn(null);
                  }
                  : undefined
                }
              >{s}</Button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const Input = ({ label, children, onSubmit, ...props }) => {
  const [inputVal, setInputVal] = useState(props.value);
  return (
    <div className="mb-4">
      <label className="block text-gray-700 text-sm font-bold mb-2">{label}</label>
      <div className="flex">
        <input className="m-1 shadow border rounded w-40 p-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          {...props}
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
        />
        <Button className="w-20" onClick={() => onSubmit(inputVal)}>Submit</Button>
      </div>
    </div>
  )
}

const Table = ({ children }) => (
  <table className="m-1 border border-green-500">{children}</table>
)
const Row = ({ thead = false, selected = false, children, ...props }) => {
  const Component = thead ? 'th' : 'tr';
  return (
    <Component className={cx('border border-green-500 cursor-pointer hover:bg-green-500', {
      'bg-green-600': selected,
    })} {...props}>{children}</Component>
  )
}
const Data = ({ th = false, children, ...props }) => {
  const Component = th ? 'th' : 'td';
  return (
    <Component className="p-1 border border-green-500" {...props}>{children}</Component>
  )
}

const Button = ({ className, onClick, children, ...props }) => (
  <div
    className={cx(className, 'm-1 p-2 rounded bg-green-400 cursor-default', {
      'cursor-pointer transition hover:bg-green-500': !!onClick,
    })}
    onClick={onClick}
    {...props}>
    {children}
  </div>
)

export default Nanoleaf;
