import React from 'react';
import cx from 'classnames';
import Discord from './components/Discord/Discord';
import Nanoleaf from './components/Nanoleaf/Nanoleaf';
import { version } from '../package.json';

function App() {
  return (
    <div className={cx('App', 'bg-green-200')} version={version}>
      <Discord />
      <Nanoleaf />
    </div>
  );
}

export default App;
