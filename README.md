# homebridge-gpio-electic-rim-lock
Homebridge plugin to open electric rim locks via Raspberry Pi GPIO pins

# Circuit
This plugin assumes that you are using a Raspberry Pi to directly control your electric rim locks. Electric rim locks usually have a switch on the wall that you can push to open the door. On my model, this is just a very simple switch that completes a 12vac circuit. The button must be pressed for about a second before the door will open. In order for this to be an effective electric rim locks opener, you need a relay that will perform the duty of the button.

![](https://github.com/roberto-montanari/homebridge-gpio-electic-rim-lock/blob/master/images/circuit.png)
