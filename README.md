# homebridge-gpio-electic-rim-lock
Homebridge plugin to open electric rim locks via Raspberry Pi GPIO pins.

## Compatibility

This plugin is designed to run **only on Raspberry Pi** hardware because it uses the `rpio` library for GPIO access. <br>
⚠️ It **will not work on other Linux systems** or in Docker containers without GPIO support.  

## Circuit

This plugin assumes that you are using a Raspberry Pi to directly control your electric rim locks. Electric rim locks usually have a switch on the wall that you can push to open the door. On my model, this is just a very simple switch that completes a 12vac circuit. The button must be pressed for about a second before the door will open. In order for this to be an effective electric rim locks opener, you need a relay that will perform the duty of the button.

![Schematic](https://github.com/roberto-montanari/homebridge-gpio-electic-rim-lock/blob/master/images/schematic.png?raw=true)

## Installation

### Via Homebridge UI (Recommended)

1. Open the Homebridge UI
2. Navigate to Plugins
3. Search for "homebridge-gpio-electic-rim-lock"
4. Click Install

### Via npm
```
npm install -g homebridge-gpio-electic-rim-lock
```
Restart Homebridge after installing.

## Configuration

### Via Homebridge UI

The plugin provides a full configuration UI. Navigate to Plugins → Settings for Homebridge Gpio Electic Rim Lock.

### Manual Configuration

Add the following accessory configuration to the Homebridge [config.json](https://github.com/nfarina/homebridge/blob/master/config-sample.json):
```JSON

{
    "accessories": [
        {
            "accessory": "Tiro",
            "name": "Door",
            "pin": 12,
            "duration": 500
        }
    ]
}

```

Fields: 

* name - The door name visible in HomeKit, can be anything (required).
* pin - The physical GPIO pin number that controls the relay (required).
* duratin - Number of milliseconds to trigger the relay. Defaults to 500 millseconds (0,5 second) if not specified.
