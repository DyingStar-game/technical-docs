---
title: Voice Over IP
sidebar_position: 5
---

# VOiP
  
There is 2 type of VOiP in the game. The Intercom VOiP, and Proximity VOiP.

### Intercom VOiP
- Player to Player, Player to Ship, or Ship to Ship, Player to Base, Ship to Base ...

### Proximity VOiP
- For the Proximity VOiP, we take inspiration from games like lethal Compagny, Peak.

- The localisation of the voices from others speaker, and the environment of this voices need to be as accurate as possible. The sound needs to be dynamically specialized with Steam audio or other Audio Raycast technique.

- The VOiP is affected by the environment, like in space solar flare, of for the player we may hear the environment bleeding in the VOiP. 
> Exemple: In a sandstorm, we here trough the com the storm.


### Devices
The sound is broadcasted from different devices, EVA Helmet, Datapad, Vehicles, Ship. It's a spatialised sound. Only the helmet give you a 2d sound for the moment. 

Exept if you can buy an in ear monitor in the Futur of the game conception. 

# Technical
We mix multiple technology:

1) The sound enter the microphone in Wwise with the audio input after being filtered from all unwanted Noises.
We use a Noisegates, and other noise reduction plugin.
2) The sound is affected by Wwise depending of the environment with creative filtering and we launch sound event mixed with the VOiP. 
3) The sound is send to the mumble server
4) .... go to ask to the network documentation service


