import { useContext } from 'react';
import { DiscordContext } from '../../context/Discord';

function Discord() {
  const discordContext = useContext(DiscordContext);

  return (
    <div className="discord">
      {discordContext && <code>
        {JSON.stringify(discordContext, null, 2)}
      </code>}
    </div>
  );
}

export default Discord;
