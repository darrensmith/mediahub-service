module.exports = Filewalker;

var util = require('util'),
    EventEmitter = require('events').EventEmitter;

var debug = false;

function JobQueueReattempt(max, timeout) {
  this.max = isNaN(max) ? 3 : max;
  this.timeout = isNaN(timeout) ? 0 : timeout;
  this.attempts = 0;
}

function FunctionQueue(options) {
  if(!(this instanceof FunctionQueue)) return new FunctionQueue(options);
  
  var self = this;
  
  this.scope = this;
  this.maxPending = -1;
  this.maxAttempts = 3;
  this.attemptTimeout = 5000;
  
  options = options || {};
  Object.keys(options).forEach(function(k) {
    if(self.hasOwnProperty(k)) {
      self[k] = options[k];
    }
  });
  
  this._reset();
}
util.inherits(FunctionQueue, EventEmitter);

FunctionQueue.prototype._reset = function() {
  this.running = false;
  this.paused = false;
  this.pending = 0;
  this.dequeued = 0;
  this.warnings = 0;
  this.errors = 0;
  this.attempts = 0;
  this.queue = [];
  return this;
};

FunctionQueue.prototype.isEmpty = function() {
  if(this.queue.length) {
    return false;
  } else {
    return true;
  }
};

FunctionQueue.prototype.error = function(err, func, args, scope, maxAttempts, timeout) {
  debug&&console.log('error', func);
  var r;
  if(args[args.length-1] instanceof JobQueueReattempt) {
    r = args[args.length-1];
    r.attempts += 1;
  } else {
    this.warnings += 1;
    r = new JobQueueReattempt(
      maxAttempts != null ? maxAttempts : this.maxAttempts,
      timeout != null ? timeout : this.attemptTimeout
    );
    args = Array.prototype.slice.call(args, 0);
    args.push(r);
  }
  if(r.attempts === r.max) {
    this.warnings -= 1;
    this.errors += 1;
    this.emit('error', err);
  } else {
    this.attempts += 1;
    this.emit('retry', func, args, err, r, scope);
    this.enqueue(func, args, scope, r.timeout);
  }
  return this;
};

FunctionQueue.prototype.start = function(func, args, scope, timeout) {
  if(this.running) {
    throw new Error('Can not start a running FunctionQueue.');
  }
  this._reset();
  this.running = true;
  this.enqueue(func, args, scope, timeout);
  this._dequeue();
  return this;
};

FunctionQueue.prototype.enqueue = function(func, args, scope, timeout) {
  debug&&console.log('enqueue', func);
  if(timeout) {
    this.queue.push([this._timeout, this, [timeout, func, scope, args]]);
  } else {
    if(typeof func === 'string') { func = (scope||this.scope)[func]; }
    this.queue.push([func, scope||this.scope, args]);
  }
  return this;
};

FunctionQueue.prototype._timeout = function(timeout, func, scope, args) {
  debug&&console.log('_timeout', timeout, func);
  var self = this;
  setTimeout(function() {
    self.enqueue(func, args, scope);
    self.done();
  }, timeout);
};

FunctionQueue.prototype._dequeue = function() {
  debug&&console.log('_dequeue');
  if(this.paused) {
    return;
  }
  
  while(this.maxPending <= 0 || this.pending < this.maxPending) {
    var item = this.queue.shift();
    if(item) {
      this.pending += 1;
      this.dequeued += 1;
      item[0].apply(item[1], item[2]);
    } else {
      break;
    }
  }
};

FunctionQueue.prototype.done = function() {
  debug&&console.log('done');
  this.pending -= 1;
  
  if(this.isEmpty() === false && (this.maxPending <= 0 || this.pending < this.maxPending)) {
    this._dequeue();
  }
  
  if(this.pending === 0) {
    if(this.paused) {
      this.emit('pause');
    } else {
      this.running = false;
      this.emit('done');
    }
  }
  return this;
};

FunctionQueue.prototype.pause = function() {
  this.paused = true;
  return this;
};

FunctionQueue.prototype.resume = function() {
  if(this.paused) {
    this.paused = false;
    if(this.isEmpty()) {
      this.pending = 1;
      this.done();
    } else {
      this._dequeue();
      this.emit('resume');
    }
  }
  return this;
};

var fs = require('fs'),
    path = require('path'),
    util = require('util'),
    immediately = process.nextTick;

if (global.setImmediate !== undefined) {
  immediately = global.setImmediate;
};

var lstat = process.platform === 'win32' ? 'stat' : 'lstat';

function Filewalker(root, options) {
  if(!(this instanceof Filewalker)) return new Filewalker(root, options);
  
  FunctionQueue.call(this, options);
  
  var self = this;
  
  this.matchRegExp = null;
  
  this.recursive = true;
  
  options = options || {};
  Object.keys(options).forEach(function(k) {
    if(self.hasOwnProperty(k)) {
      self[k] = options[k];
    }
  });
  
  this.root = path.resolve(root||'.');
}
util.inherits(Filewalker, FunctionQueue);

Filewalker.prototype._path = function(p) {
  if(path.relative) {
    return path.relative(this.root, p).split('\\').join('/');
  } else {
    return p.substr(this.root.length).split('\\').join('/');
  }
};

Filewalker.prototype._emitDir = function(p, s, fullPath) {
  var self = this,
      args = arguments;
  
  this.dirs += 1;
  if(this.dirs) { // skip first directroy
    this.emit('dir', p, s, fullPath);
  }
  
  fs.readdir(fullPath, function(err, files) {
    if(err) {
      self.error(err, self._emitDir, args);
    } else if(self.recursive || !self.dirs) {
      files.forEach(function(file) {
        self.enqueue(self._stat, [path.join(fullPath, file)]);
      });
    }
    self.done();
  });
};

Filewalker.prototype._emitFile = function(p, s, fullPath) {
  var self = this;
  
  this.files += 1;
  this.bytes += s.size;
  this.emit('file', p, s, fullPath);
  
  if(this.listeners('stream').length !== 0) {
    this.enqueue(this._emitStream, [p, s, fullPath]);
  }
  
  immediately(function() {
    self.done();
  });
};

Filewalker.prototype._emitStream = function(p, s, fullPath) {
  var self = this,
      args = arguments;
  
  this.open += 1;
  
  var rs = fs.ReadStream(fullPath);
  
  // retry on any error
  rs.on('error', function(err) {
    // handle "too many open files" error
    if(err.code == 'EMFILE' || (err.code == 'OK' && err.errno === 0)) {
      if(self.open-1>self.detectedMaxOpen) {
        self.detectedMaxOpen = self.open-1;
      }
      
      self.enqueue(self._emitStream, args);
    } else {
      self.error(err, self._emitStream, args);
    }
    
    self.open -= 1;
    self.done();
  });

  rs.on('close', function() {
    self.streamed += 1;
    self.open -= 1;
    self.done();
  });
  
  this.emit('stream', rs, p, s, fullPath);
  
};

Filewalker.prototype._stat = function(p) {
  var self = this,
      args = arguments;
  
  fs[lstat](p, function(err, s) {
    if(err) {
      self.error(err, self._stat, args);
    } else {
      self.total += 1;
      if(s.isDirectory()) {
        self.enqueue(self._emitDir, [self._path(p), s, p]);
      } else {
        if(!self.matchRegExp || self.matchRegExp.test(p)) {
          self.enqueue(self._emitFile, [self._path(p), s, p]);
        }
      }
    }
    self.done();
  });
};

Filewalker.prototype.walk = function() {
  this.dirs = -1;
  this.files = 0;
  this.total = -1;
  this.bytes = 0;
  
  this.streamed = 0;
  this.open = 0;
  this.detectedMaxOpen = -1;
  
  this.queue = [];
  
  this.start(this._stat, [this.root]);
  return this;
};