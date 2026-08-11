---
title: Car Engine
sidebar_position: 1
---

# Car Engine

## Introduction

For now, engines sounds in Dying Star are made using [Engine Simulator](https://www.engine-sim.parts/), which emulates engine sounds with great control. It allows us to get a detailed result without having to record an actual engine or having to find royalty free sounds. Then, sounds produced from Engine Simulator are [recorded](#recording-process) and [edited](#editing-process) to be finally [imported into Wwise](#wwise).

## Engine Simulator
>**What is it ?**  
This is a real-time internal combustion engine simulation designed specifically to produce engine audio and simulate engine response characteristics. It is NOT a scientific tool and cannot be expected to provide accurate figures for the purposes of engineering or engine tuning.  
>
>**How do I get it?**  
Click "Download" in the top right corner of [this page](https://www.engine-sim.parts/), expand "Assets" and click on the build zip file. Extract the zip, open the "bin" folder, start "engine-sim-app.exe", and you're off to the races!  
>
>*Snippet from the Engine Simulator website*

### Tips and tricks
:::note
This is not a complete guide so if you need, please refer to the [official documentation](https://github.com/Engine-Simulator/engine-sim-community-edition/tree/master/tutorial)
:::
<a id="engine-limiter"></a>
First steps (with *Limiter*) :
- to start the engine, press **a** for *Ignition*, then hold **s** for a few seconds to start the engine
- press **d**, then **h** to turn the *Limiter* on
- hold **g** and **scroll** up or down to set RPMs

## Recording Process
### How to extract sound
There are different ways to extract sound from Engine Simulator :
- Using a soundcard that has a Loopback feature (such as the Motu M2). Then, in your DAW, you can set Loopback as a recording input.  
![alt text](/img/audio/vehicle/terrestrial/VehicleLoopback.png)
- Using a software to emulate a Loopback input (not tested)

### What you should record
In order to get a usable result, we need to record steady sounds (this is something you can achieve in Engine Simulator by using the [Limiter](#engine-limiter)). What I mean by *steady sound* is a sound that doesn't change in pitch and intensity, which is important to get a cohesive result as we need to control pitch afterwards inside Wwise.
Then, you can record about once every 2000 RPM, for 4 to 8 seconds. Here is an example :
<a id="recording-screenshot"></a>
![alt text](/img/audio/vehicle/terrestrial/VehicleRecordingExample.png)
:::note
We can see that I put markers for each RPM steps, but only 5 of them have been actually exported as we need a noticable change between files.
:::

## Editing Process
After recording the different RPMs, there isn't much editing to do, but it's a good time to add some effects to give more depth to your engine sound. For instance, you can add saturation, EQ and a short convolution reverb.

### Export (in Cubase)
:::note
Any different way to export is good, this is just a convenient way to batch export in Cubase
:::
As we can see in my [previous screenshot](#recording-screenshot), I have many markers for each RPM steps. In cubase, you can do batch exports by following these steps :
1. select Cycle Markers instead of Locators in the export menu
2. tick the checkboxes for each Cycle Marker you want to export
3. set a name scheme by clicking the Settings button next to the file name input
4. drag and drop Cycle markers name into the Result input

![Batch export in Cubase](/img/audio/vehicle/terrestrial/VehicleBatchExports_1.png)
![Batch export in Cubase](/img/audio/vehicle/terrestrial/VehicleBatchExports_2.png)

## Wwise
Import sounds (show list of RPM files)  
use of blend track, why  
layering  
RTPC  
pitch based on RTPC  
Event Start, start sound and RTPC set to 0  
things to improve / questions  

### Import sounds
We can now import our sounds, including :
- RPM steps
- neutral sound (when the vehicle doesn't move)
- start and stop

![List of RPM sources in Wwise](/img/audio/vehicle/terrestrial/VehicleWwiseImport.png)

Once imported, each RPM needs to be loopable, so the engine sounds can continuously play.
![Setup loop in wwise](/img/audio/vehicle/terrestrial/GIF_Wwise_Loop.gif)

### RTPC
In this case, we only use the RTPC named RPM
### Blend track
#### Layering
#### Automation
### Event
### Things to improve

## Godot