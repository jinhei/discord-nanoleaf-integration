import _ from 'lodash';
import cx from 'classnames';

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
  const [muteScene, setMuteScene] = useState(NANOLEAF_SCENES.MUTED);
  const [unmuteScene, setUnmuteScene] = useState(NANOLEAF_SCENES.NOT_MUTED);
  const [defaultScene, setDefaultScene] = useState(NANOLEAF_SCENES.NOT_IN_CALL);

  const [selectionFn, setSelectionFn] = useState(null);
  console.log({ selectionFn, setDefaultScene, muteScene, unmuteScene, defaultScene });

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
    console.log('nanoleaf-setScene', scene)
    ipcRenderer.invoke('nanoleaf-setScene', scene);
    ipcRenderer.invoke('electron-icon-overlay', icon);
  }, [defaultScene, muteScene, unmuteScene, voiceSettings, voiceChannelId]);

  return (
    <div className="bg-green-200">
      <h2>Nanoleaf</h2>
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
                    console.log(':::: button click', s)
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
