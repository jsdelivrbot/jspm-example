/* */ 
var crypto = require('crypto');
var MD5 = {
  itoa64: './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  to64: function(index, count) {
    var result = '';
    while (--count >= 0) {
      result += MD5.itoa64[index & 63];
      index = index >> 6;
    }
    return result;
  },
  getSalt: function(inputSalt) {
    var salt = '';
    if (inputSalt) {
      salt = inputSalt.split("$")[2];
    } else {
      while (salt.length < 8) {
        var rchIndex = Math.floor((Math.random() * 64));
        salt += MD5.itoa64[rchIndex];
      }
    }
    return salt;
  },
  getPassword: function(final) {
    var epass = '';
    epass += MD5.to64((final.charCodeAt(0) << 16) | (final.charCodeAt(6) << 8) | final.charCodeAt(12), 4);
    epass += MD5.to64((final.charCodeAt(1) << 16) | (final.charCodeAt(7) << 8) | final.charCodeAt(13), 4);
    epass += MD5.to64((final.charCodeAt(2) << 16) | (final.charCodeAt(8) << 8) | final.charCodeAt(14), 4);
    epass += MD5.to64((final.charCodeAt(3) << 16) | (final.charCodeAt(9) << 8) | final.charCodeAt(15), 4);
    epass += MD5.to64((final.charCodeAt(4) << 16) | (final.charCodeAt(10) << 8) | final.charCodeAt(5), 4);
    epass += MD5.to64(final.charCodeAt(11), 2);
    return epass;
  },
  encrypt: function(password, salt) {
    var magic = '';
    if (salt && salt.split('$')[1] === '1') {
      magic = '$1$';
    } else {
      magic = '$apr1$';
    }
    salt = MD5.getSalt(salt);
    var ctx = password + magic + salt;
    var final = crypto.createHash('md5').update(password + salt + password).digest("binary");
    for (var pl = password.length; pl > 0; pl -= 16) {
      ctx += final.substr(0, (pl > 16) ? 16 : pl);
    }
    for (var i = password.length; i; i >>= 1) {
      if (i % 2) {
        ctx += String.fromCharCode(0);
      } else {
        ctx += password.charAt(0);
      }
    }
    final = crypto.createHash('md5').update(ctx).digest("binary");
    for (var i = 0; i < 1000; ++i) {
      var ctxl = '';
      if (i % 2) {
        ctxl += password;
      } else {
        ctxl += final.substr(0, 16);
      }
      if (i % 3) {
        ctxl += salt;
      }
      if (i % 7) {
        ctxl += password;
      }
      if (i % 2) {
        ctxl += final.substr(0, 16);
      } else {
        ctxl += password;
      }
      final = crypto.createHash('md5').update(ctxl).digest("binary");
    }
    return magic + salt + "$" + MD5.getPassword(final);
  }
};
module.exports = MD5.encrypt;
