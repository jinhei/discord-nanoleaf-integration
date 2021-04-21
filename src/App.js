import './App.css';
import { useContext } from 'react';
import Discord from './components/Discord/Discord';
import { DiscordContext } from './context/Discord';

function App() {
  const { isConnected, isLoggedIn, login } = useContext(DiscordContext);
  console.log(':::', { isLoggedIn, login });

  return (
    <div className="App">
      <p>Discord {isLoggedIn ? 'connected' : 'disconnected'}</p>
      {!isConnected && <button onClick={login}>Connect</button>}
      {isConnected && <Discord/>}
    </div>
  );
}

export default App;
