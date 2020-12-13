# discord-nanoleaf-integration

Run start.bat to run the program.

## How it works

Batch script runs every 2 seconds. The script takes a screenshot, then compares against images of discord status area to see if you're in a call / if you are muted. If you are, it hits the nanoleaf REST API to set the scene specified.

### Why do it in this janky way?

Discord only has the Game SDK (for integrating with your game) and Bot APIs. The Game SDK is only for c/cpp/c#, which I'm too lazy to implement. When RPC is out of private beta, it may be used to access this information. 

## Setup

This needs to run on a machine on the same network as your Nanoleaf and uses the REST API documented [here](https://documenter.getpostman.com/view/1559645/RW1gEcCH).