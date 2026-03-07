"use strict";
var Service, Characteristic;
var rpio = require('rpio');

module.exports = function(homebridge) {
	Service = homebridge.hap.Service;
	Characteristic = homebridge.hap.Characteristic;

	homebridge.registerAccessory('homebridge-gpio-electic-rim-lock', 'Tiro', ElecticRimLockAccessory);	
}

function getSerial(){
	var fs = require('fs');
  	var cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
  	var match = cpuinfo.match(/Serial\s*:\s*([a-f0-9]+)/i);
  	return match ? match[1] : null;
}

function ElecticRimLockAccessory(log, config) {
	this.log = log;
	this.name = config['name'];
	this.pin = config['pin'];
	this.duration = config['duration'];
	this.version = require('./package.json').version;
	this.lastLockTargetState = 1;

	if (!this.name || !this.pin) {
		this.log.warn("You must provide a valid config value for name and pin.");
		this.disabled = true;
		return;
	}
	if (this.duration == null || this.duration % 1 != 0) this.duration = 500;
	this.log("Tiro GPIO version: " + this.version);
	this.log("Switch pin: " + this.pin);
	this.log("Active time: " + this.duration + " ms");
}

ElecticRimLockAccessory.prototype = {
  
	getServices: function() {	
		let informationService = new Service.AccessoryInformation();
		informationService
    		.setCharacteristic(Characteristic.Manufacturer, "Roberto Montanari")
			.setCharacteristic(Characteristic.Model, "Tiro GPIO")
			.setCharacteristic(Characteristic.SerialNumber, getSerial() + this.pin)
			.setCharacteristic(Characteristic.FirmwareRevision, this.version);

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
			this.log("Wait for " + this.duration + " ms");
			var self = this;
			setTimeout(function(){self.writePin(0)}, this.duration);
			this.log("Set state to open");
			this.lastLockTargetState = 0;
			callback(null);
		} else {
			this.writePin(0);
			this.log("Set state to closed");
			this.lastLockTargetState = 1;
			callback(null);
		}						
	},

	writePin: function(val) {	
		this.log("Turning " + (val == 0 ? "off" : "on") + " pin " + this.pin);
		rpio.open(this.pin, rpio.OUTPUT);
		rpio.write(this.pin, val);
	}
}
