"use strict";
var Service, Characteristic;
var rpio = require('rpio');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;
	
	homebridge.registerAccessory('homebridge-gpio-electic-rim-lock', 'Tiro', ElecticRimLockAccessory);	
}

function ElecticRimLockAccessory(log, config) {
	this.log = log;
	this.name = config['name'];
	this.pin = config['pin'];
	this.duration = config['duration'];
	this.lastLockTargetState = 1;

	if (!this.pin) throw new Error("You must provide a config value for pin.");
	if (this.duration == null || this.duration % 1 != 0) this.duration = 1000;
}

ElecticRimLockAccessory.prototype = {
  
	getServices: function() {	
		let informationService = new Service.AccessoryInformation();
    	informationService
    		.setCharacteristic(Characteristic.Manufacturer, "Roberto Montanari")
		.setCharacteristic(Characteristic.Model, "Tiro GPIO")
		.setCharacteristic(Characteristic.SerialNumber, "000-000-0"+this.pin)
		.setCharacteristic(Characteristic.FirmwareRevision, packageJson.version);

		let lockMechanismService = new Service.LockMechanism(this.name);
		lockMechanismService
    		.getCharacteristic(Characteristic.LockCurrentState)
    			.on('get', this.getLockCurrentState.bind(this));		
		lockMechanismService
    		.getCharacteristic(Characteristic.LockTargetState)
    			.on('get', this.getLockTargetState.bind(this))
    			.on('set', this.setLockTargetState.bind(this));

		this.informationService = informationService;
		this.lockMechanismService = lockMechanismService;
		
		return [informationService, lockMechanismService];
	},

	getLockCurrentState: function(callback) {
		if (this.lastLockTargetState == 0) {
			this.lastLockTargetState = 1;
			callback(null, 0);
		} else {
			callback(null, 1);
		}
	},

	getLockTargetState: function(callback) {
		this.lastLockTargetState = 1;
		callback(null, 1);
	},

	setLockTargetState: function(state, callback) {
		if (state == 0) {
			this.writePin(1);
			this.log("Wait " + this.duration + " ms");
			var self = this;
			setTimeout(function(){self.writePin(0)}, this.duration);
			this.log("Set state to open");
			this.lastLockTargetState = 0;
			callback(null);
		} else {
			this.writePin(0);
			this.log("Set state to close");
			this.lastLockTargetState = 1;
			callback(null);
		}						
	},

	writePin: function(val) {	
		this.log("Turning " + (val == 0 ? "off" : "on") + " pin #" + this.pin);
		rpio.open(this.pin, rpio.OUTPUT);
		rpio.write(this.pin, val == 0 ? rpio.LOW : rpio.HIGH);
	}
}
