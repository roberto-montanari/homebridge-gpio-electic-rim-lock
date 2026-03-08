"use strict";

var Service, Characteristic;
var rpio = require('rpio');
var fs = require('fs');

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;

    homebridge.registerPlatform(
        'homebridge-gpio-electric-rim-lock',
        'Tiro',
        ElectricRimLockPlatform,
        true // dynamic platform
    );
};

function getSerial() {
    var fs = require('fs');
    var cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
    var match = cpuinfo.match(/Serial\s*:\s*([a-f0-9]+)/i);
    return match ? match[1] : null;
}

// ==========================
// Platform Class
// ==========================
function ElectricRimLockPlatform(log, config, api) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.accessories = [];

    var that = this;

    api.on('didFinishLaunching', function() {
        that.log("Platform finished launching. Discovering devices...");
        that.discoverDevices();
    });
}

ElectricRimLockPlatform.prototype = {
    configureAccessory: function(accessory) {
        this.accessories.push(accessory);
    },

    discoverDevices: function() {
        var locks = this.config.locks || [];

        if (!locks.length) {
            this.log.warn("⚠ No locks configured in the 'locks' array.");
            return;
        }

        var that = this;

        locks.forEach(function(lockConfig) {
            if (!lockConfig.name || !lockConfig.pin) {
                that.log.warn("⚠ Lock missing name or pin, skipping.");
                return;
            }

            var uuid = that.api.hap.uuid.generate("gpio-rim-lock-" + lockConfig.pin);

            var accessory = new that.api.platformAccessory(lockConfig.name, uuid);
            accessory.context.pin = lockConfig.pin;

            that.api.registerPlatformAccessories(
                'homebridge-gpio-electric-rim-lock',
                'Tiro',
                [accessory]
            );

            new ElectricRimLockAccessory(that.log, lockConfig, that.api, accessory);
        });
    }
};

// ==========================
// Accessory Class
// ==========================
function ElectricRimLockAccessory(log, config, api, accessory) {
    this.log = log;
    this.config = config;
    this.api = api;
    this.accessory = accessory;

    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    this.name = config['name'];
    this.pin = config['pin'];
    this.duration = config['duration'];
    this.version = require('./package.json').version;
    this.lastLockTargetState = 1;

    if (!this.name || !this.pin) {
        this.log.warn("⚠ RimLock not configured correctly: name or pin missing. Plugin disabled.");
        this.disabled = true;
        return;
    }

	var cpuinfo = fs.readFileSync('/proc/cpuinfo', 'utf8');
	if (!/Raspberry Pi/i.test(cpuinfo)) {
        this.log.warn("⚠ This plugin is intended to run only on Raspberry Pi.  Some features may not work.");
    }

    if (this.duration == null || this.duration % 1 !== 0) this.duration = 500;

    this.log("Tiro GPIO version: " + this.version);
    this.log("Switch pin: " + this.pin);
    this.log("Active time: " + this.duration + " ms");

    // Register services
    this.informationService = new this.Service.AccessoryInformation();
    this.informationService
        .setCharacteristic(this.Characteristic.Manufacturer, "Roberto Montanari")
        .setCharacteristic(this.Characteristic.Model, "Tiro GPIO")
        .setCharacteristic(this.Characteristic.SerialNumber, getSerial() + this.pin)
        .setCharacteristic(this.Characteristic.FirmwareRevision, this.version);

    this.lockMechanismService =
        accessory.getService(this.Service.LockMechanism) ||
        accessory.addService(this.Service.LockMechanism, this.name);

    var that = this;

    this.lockMechanismService
        .getCharacteristic(this.Characteristic.LockCurrentState)
        .on('get', function(callback) { that.getLockCurrentState(callback); });

    this.lockMechanismService
        .getCharacteristic(this.Characteristic.LockTargetState)
        .on('get', function(callback) { that.getLockTargetState(callback); })
        .on('set', function(state, callback) { that.setLockTargetState(state, callback); });
}

ElectricRimLockAccessory.prototype = {

    getLockCurrentState: function(callback) {
        if (this.lastLockTargetState === 0) {
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
        if (this.disabled) {
            this.log.warn("Plugin disabled, command ignored.");
            return callback(null);
        }

        if (state === 0) { // Unlock
            this.writePin(1);
            this.log("Waiting for " + this.duration + " ms");
            setTimeout(() => this.writePin(0), this.duration);
            this.log("Lock state set to OPEN");
            this.lastLockTargetState = 0;
            callback(null);
        } else { // Lock
            this.writePin(0);
            this.log("Lock state set to CLOSED");
            this.lastLockTargetState = 1;
            callback(null);
        }
    },

    writePin: function(val) {
        if (this.disabled) return;

        try {
            rpio.open(this.pin, rpio.OUTPUT, rpio.LOW);
            rpio.write(this.pin, val);
            this.log("GPIO pin " + this.pin + " set " + (val === 0 ? "OFF" : "ON"));
        } catch (err) {
            this.log.error("GPIO error on pin " + this.pin + ": " + err.message);
        }
    },

    getServices: function() {
        return this.disabled ? [] : [this.informationService, this.lockMechanismService];
    }
};
