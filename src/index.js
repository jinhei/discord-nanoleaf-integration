import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { DiscordProvider } from './context/Discord';

ReactDOM.render(
  <React.StrictMode>
    <DiscordProvider>
      <App />
    </DiscordProvider>
  </React.StrictMode>,
  document.getElementById('root'),
);
