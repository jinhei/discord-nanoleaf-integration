import React, { useContext } from 'react';
import cx from 'classnames';

import { DiscordContext } from '../../context/Discord';

const UserCard = () => {
  const { user, login } = useContext(DiscordContext);

  let cardContents;
  let onClick;
  if (user) {
    const {
      avatar,
      id,
      username,
      discriminator,
    } = user;
    const avatarUrl = `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
    cardContents = (<>
      <div className="flex-shrink-0 overflow-hidden rounded-full">
        <img
          className="w-10 h-10"
          src={avatarUrl}
        />
      </div>
      <div className="ml-1 flex flex-col">
        <h2 className="text-l">{username}</h2>
        <h4 className="text-sm text-gray-300">#{discriminator}</h4>
      </div>
    </>);
  } else {
    onClick = login;
    cardContents = (
      <h2 className="text-1">Login to Discord</h2>
    )
  }

  return (
    <div
      className={cx(
        'max-w-s w-max p-2 pr-8 flex shadow-md text-gray-100 bg-gray-700 overflow-hidden rounded-md items-center',
        {
          'cursor-pointer transition hover:bg-gray-800': !!onClick,
        },
      )}
      onClick={onClick}>
      {cardContents}
    </div>
  )
}

export default UserCard;
