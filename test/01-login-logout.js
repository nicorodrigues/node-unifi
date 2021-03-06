/* global describe, it */
/* eslint-disable camelcase, import/no-unassigned-import */

require('should');
const unifi = require('../unifi.js');

let CONTROLLER_IP = '127.0.0.1';
if (process.env.CONTROLLER_IP) {
  CONTROLLER_IP = process.env.CONTROLLER_IP;
}

let CONTROLLER_PORT = 8443;
if (process.env.CONTROLLER_PORT) {
  CONTROLLER_PORT = process.env.CONTROLLER_PORT;
}

let CONTROLLER_USER = 'ubnt';
if (process.env.CONTROLLER_USER) {
  CONTROLLER_USER = process.env.CONTROLLER_USER;
}

let CONTROLLER_PASS = 'ubnt';
if (process.env.CONTROLLER_PASS) {
  CONTROLLER_PASS = process.env.CONTROLLER_PASS;
}

// Run the tests
describe('Running tests', () => {
  const controller = new unifi.Controller(CONTROLLER_IP, CONTROLLER_PORT);

  // LOGIN
  it('login()', done => {
    if (controller !== null) {
      controller.login(CONTROLLER_USER, CONTROLLER_PASS, error => {
        if (error) {
          done(error);
        } else {
          done();
        }
      });
    }
  });

  // GET SITE STATS
  let controller_sites = null;
  it('getSitesStats()', done => {
    controller.getSitesStats((error, sites) => {
      if (error) {
        done(error);
      } else if (typeof (sites) === 'undefined' || sites.length <= 0) {
        done('ERROR: getSitesStats()');
      } else {
        controller_sites = sites;
        done();
      }
    });
  });

  // AUTHORIZE GUEST
  it('authorizeGuest()', done => {
    controller.authorizeGuest(controller_sites[0].name, 'aa:bb:CC:DD:EE:FF', 100, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: authorizeGuest()');
      } else {
        result[0][0].mac.should.equal('aa:bb:cc:dd:ee:ff');
        result[0][0].end.should.aboveOrEqual(result[0][0].start + (100 * 60));
        result[0][0].end.should.belowOrEqual(result[0][0].start + (140 * 60));
        result[0][0].qos_rate_max_up.should.equal(20);
        result[0][0].qos_rate_max_down.should.equal(30);
        result[0][0].qos_usage_quota.should.equal(40);
        done();
      }
    }, 20, 30, 40, 'aa:bb:cc:dd:ee:fa');
  });

  // UN-AUTHORIZE GUEST
  it('unauthorizeGuest()', done => {
    controller.unauthorizeGuest(controller_sites[0].name, 'aa:bb:CC:DD:EE:FF', (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: unauthorizeGuest()');
      } else {
        done();
      }
    });
  });

  // Reconnect a client device
  it('reconnectClient()', done => {
    controller.unauthorizeGuest(controller_sites[0].name, 'aa:bb:CC:DD:EE:FF', (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: reconnectClient()');
      } else {
        done();
      }
    });
  });

  // Block a client device
  it('blockClient()', done => {
    controller.blockClient(controller_sites[0].name, 'aa:bb:CC:DD:EE:FF', (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: blockClient()');
      } else {
        result[0][0].mac.should.equal('aa:bb:cc:dd:ee:ff');
        result[0][0].blocked.should.equal(true);
        done();
      }
    });
  });

  // Unblock a client device
  it('unblockClient()', done => {
    controller.unblockClient(controller_sites[0].name, 'aa:bb:CC:DD:EE:FF', (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: unblockClient()');
      } else {
        result[0][0].mac.should.equal('aa:bb:cc:dd:ee:ff');
        result[0][0].blocked.should.equal(false);
        done();
      }
    });
  });

  // List user groups
  let defaultGroupID = null;
  it('getUserGroups()', done => {
    controller.getUserGroups(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getUserGroups()');
      } else {
        result[0][0].name.should.equal('Default');
        result[0][0].attr_no_delete.should.equal(true);
        defaultGroupID = result[0][0]._id;
        done();
      }
    });
  });

  // Create a new user/client-device
  let createdUserID = null;
  it('createUser()', done => {
    controller.createUser(controller_sites[0].name, 'FF:EE:DD:CC:bb:aa', defaultGroupID, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: createUser()');
      } else if (typeof (result[0][0].meta.msg) === 'undefined') {
        result[0][0].meta.rc.should.equal('ok');
        result[0][0].data[0].mac.should.equal('ff:ee:dd:cc:bb:aa');
        result[0][0].data[0].name.should.equal('createUserTest');
        result[0][0].data[0].note.should.equal('createUserTest note');
        result[0][0].data[0].is_wired.should.equal(true);
        result[0][0].data[0].is_guest.should.equal(false);
        createdUserID = result[0][0].data[0]._id;
        done();
      } else {
        done(result[0][0].meta.msg);
      }
    }, 'createUserTest', 'createUserTest note', true, false);
  });

  // Add/modify/remove a client device not
  it('setClientNote()', done => {
    controller.setClientNote(controller_sites[0].name, createdUserID, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: setClientNote()');
      } else {
        result[0][0].note.should.equal('createUserTest note changed');
        result[0][0].name.should.equal('createUserTest');
        result[0][0].mac.should.equal('ff:ee:dd:cc:bb:aa');
        result[0][0].is_wired.should.equal(true);
        result[0][0].is_guest.should.equal(false);
        done();
      }
    }, 'createUserTest note changed');
  });

  // Add/modify/remove a client device not
  it('setClientName()', done => {
    controller.setClientName(controller_sites[0].name, createdUserID, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: setClientName()');
      } else {
        result[0][0].note.should.equal('createUserTest note changed');
        result[0][0].name.should.equal('createUserTest changed');
        result[0][0].mac.should.equal('ff:ee:dd:cc:bb:aa');
        result[0][0].is_wired.should.equal(true);
        result[0][0].is_guest.should.equal(false);
        done();
      }
    }, 'createUserTest changed');
  });

  // 5 minutes site stats method
  it('get5minSiteStats()', done => {
    controller.get5minSiteStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: get5minSiteStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Hourly site stats method
  it('getHourlySiteStats()', done => {
    controller.getHourlySiteStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getHourlySiteStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Daily site stats method
  it('getDailySiteStats()', done => {
    controller.getDailySiteStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getDailySiteStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // 5 minutes stats method for a single access point or all access points
  it('get5minApStats()', done => {
    controller.get5minApStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: get5minApStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Hourly stats method for a single access point or all access points
  it('getHourlyApStats()', done => {
    controller.getHourlyApStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getHourlyApStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Daily stats method for a single access point or all access points
  it('getDailyApStats()', done => {
    controller.getDailyApStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getDailyApStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // 5 minutes stats method for a single user/client device
  it('get5minUserStats()', done => {
    controller.get5minUserStats(controller_sites[0].name, 'ff:ee:dd:cc:bb:aa', (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: get5minUserStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Hourly stats method for a a single user/client device
  it('getHourlyUserStats()', done => {
    controller.getHourlyUserStats(controller_sites[0].name, 'ff:ee:dd:cc:bb:aa', (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getHourlyUserStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Daily stats method for a single user/client device
  it('getDailyUserStats()', done => {
    controller.getDailyUserStats(controller_sites[0].name, 'ff:ee:dd:cc:bb:aa', (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getDailyUserStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // 5 minutes gateway stats method
  it('get5minGatewayStats()', done => {
    controller.get5minGatewayStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: get5minGatewayStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Hourly gateway stats method
  it('getHourlyGatewayStats()', done => {
    controller.getHourlyGatewayStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getHourlyGatewayStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Daily gateway stats method
  it('getDailyGatewayStats()', done => {
    controller.getDailyGatewayStats(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getDailyGatewayStats()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Method to fetch speed test results
  it('getSpeedTestResults()', done => {
    controller.getSpeedTestResults(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getSpeedTestResults()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Method to fetch IPS/IDS event
  it('getIPSEvents()', done => {
    controller.getIPSEvents(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getIPSEvents()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Show all login sessions
  it('getSessions()', done => {
    controller.getSessions(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getSessions()');
      } else {
        console.log(result);
        done();
      }
    });
  });

  // Show latest 'n' login sessions for a single client device
  it('getLatestSessions()', done => {
    controller.getLatestSessions(controller_sites[0].name, 'ff:ee:dd:cc:bb:aa', (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length < 0) {
        done('ERROR: getLatestSessions()');
      } else {
        done();
      }
    });
  });

  // Show all authorizations
  it('getAllAuthorizations()', done => {
    controller.getAllAuthorizations(controller_sites[0].name, (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined' || result.length <= 0) {
        done('ERROR: getAllAuthorizations()');
      } else {
        done();
      }
    });
  });

  // Forget one or more client devices
  it('forgetClient()', done => {
    controller.forgetClient(controller_sites[0].name, ['aa:bb:cc:dd:ee:ff', 'FF:EE:DD:CC:bb:aa'], (error, result) => {
      if (error) {
        done(error);
      } else if (typeof (result) === 'undefined') {
        done('ERROR: forgetClient()');
      } else {
        done();
      }
    });
  });

  // GET SITE SYSINFO
  it('getSiteSysinfo()', done => {
    controller.getSiteSysinfo(controller_sites[0].name, (error, sysinfo) => {
      if (error) {
        done(error);
      } else if (typeof (sysinfo) === 'undefined' || sysinfo.length <= 0) {
        done('ERROR: getSiteSysinfo()');
      } else {
        done();
      }
    });
  });

  // GET CLIENT DEVICES
  it('getClientDevices()', done => {
    controller.getClientDevices(controller_sites[0].name, (error, client_data) => {
      if (error) {
        done(error);
      } else if (typeof (client_data) === 'undefined' || client_data.length < 0) {
        done('ERROR: getClientDevices()');
      } else {
        done();
      }
    });
  });

  // GET ALL USERS EVER CONNECTED
  it('getAllUsers()', done => {
    controller.getAllUsers(controller_sites[0].name, (error, users_data) => {
      if (error) {
        done(error);
      } else if (typeof (users_data) === 'undefined' || users_data.length < 0) {
        done('ERROR: getAllUsers()');
      } else {
        done();
      }
    });
  });

  // GET ALL ACCESS DEVICES
  it('getAccessDevices()', done => {
    controller.getAccessDevices(controller_sites[0].name, (error, access_data) => {
      if (error) {
        done(error);
      } else if (typeof (access_data) === 'undefined' || access_data.length < 0) {
        done('ERROR: getAccessDevices()');
      } else {
        done();
      }
    });
  });

  // GET ALL SESSIONS
  it('getSessions()', done => {
    controller.getSessions(controller_sites[0].name, (error, session_data) => {
      if (error) {
        done(error);
      } else if (typeof (session_data) === 'undefined' || session_data.length < 0) {
        done('ERROR: getSessions()');
      } else {
        done();
      }
    });
  });

  // GET ALL AUTHORIZATIONS
  it('getAllAuthorizations()', done => {
    controller.getAllAuthorizations(controller_sites[0].name, (error, auth_data) => {
      if (error) {
        done(error);
      } else if (typeof (auth_data) === 'undefined' || auth_data.length < 0) {
        done('ERROR: getSessions()');
      } else {
        done();
      }
    });
  });

  // GET USERS
  it('getUsers()', done => {
    controller.getUsers(controller_sites[0].name, (error, user_data) => {
      if (error) {
        done(error);
      } else if (typeof (user_data) === 'undefined' || user_data.length < 0) {
        done('ERROR: getUsers()');
      } else {
        done();
      }
    });
  });

  // GET SELF
  it('getSelf()', done => {
    controller.getSelf(controller_sites[0].name, (error, self_data) => {
      if (error) {
        done(error);
      } else if (typeof (self_data) === 'undefined' || self_data.length < 0) {
        done('ERROR: getSelf()');
      } else {
        done();
      }
    });
  });

  // LOGOUT
  it('logout()', done => {
    controller.logout(error => {
      if (error) {
        done(error);
      } else {
        done();
      }
    });
  });
});
