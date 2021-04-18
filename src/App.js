import logo from './logo.svg';
import './App.css';
import { login, useConnected } from './hooks/discord';

function App() {
  const isConnected = useConnected();

  return (
    <div className="App">
      <p>Discord {isConnected ? 'connected' : 'disconnected'}</p>
      {!isConnected && <button onClick={login}>Connect</button>}
    </div>
  );
}

export default App;
