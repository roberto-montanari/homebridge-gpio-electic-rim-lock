# homebridge-gpio-electic-rim-lock
Homebridge plugin to open electric rim locks via Raspberry Pi GPIO pins.

# Circuit

This plugin assumes that you are using a Raspberry Pi to directly control your electric rim locks. Electric rim locks usually have a switch on the wall that you can push to open the door. On my model, this is just a very simple switch that completes a 12vac circuit. The button must be pressed for about a second before the door will open. In order for this to be an effective electric rim locks opener, you need a relay that will perform the duty of the button.

![Schematic](https://github.com/roberto-montanari/homebridge-gpio-electic-rim-lock/blob/master/images/circuit.png?raw=true)

# Installation

Install this plugin using: 
```
sudo npm install -g homebridge-gpio-electic-rim-lock --unsafe-perm
```


# Configuration

You will need to add the following accessory configuration to the Homebridge [config.json](https://github.com/nfarina/homebridge/blob/master/config-sample.json).

Configuration sample:

```JSON
{
    "bridge": {
        "name": "Raspberry Pi 2",
        "username": "CC:22:3D:E3:CE:32",
        "port": 51826,
        "pin": "031-45-154"
    },

    "accessories": [
        {
                "accessory": "Tiro",
                "name": "Door",
                "pin": 12,
                "duration": 4000
        }
    ],

    "platforms": []
}

```

Fields: 

* name - Can be anything (required).
* pin - The physical GPIO pin number that controls the relay (required).
* duratin - Number of milliseconds to trigger the relay. Defaults to 1000 millseconds (1 second) if not specified.
