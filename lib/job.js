'use strict';


var request = require('./request');

var Job = function(jobData, client) {
  this.data   = jobData;
  this.client = client;
  return this;
};

Job.prototype.url = function() {
  return this.client.jobQueueUrl + '/jobs/' + this.data._id;
};

// Takes a job from the queue
//
// @job   {Object}    The job record
// @cb    {Function}  The function to execute once finished
//
Job.prototype.take = function(cb) {
  var self = this;
  request.put(this.url() + '/take', function (err, res, body) {
    if (err) {
      cb(err);
    } else if(res.statusCode !== 201) {
      cb(new Error(body));
    } else {
      this.client.currentJob = self;
      cb(null);
    }
  });
};


Job.prototype.reportProgress = function (progress) {
  var url = this.data.webhooks.processing[0].url, self = this;
  request.put({ url: url, body: {progress: progress} }, function (err) {
    if (err) {
      self.reportError(err);
    }
  });
};

Job.prototype.reportError = function (err, cb) {
  var self = this;
  this.data.metadata.dataToSendWhenFailed.progress.data = err;
  request.put({ url: this.url() + '/fail', body: { job: this.data } }, function () {
    request.put(self.url() + '/release', function () {
      if (cb && typeof cb === 'function') {
        cb(err);
      } else {
        console.log(err);
        process.exit(1);
      }
    });
  });
};


// Completes the job
//
// @job   {Object}    The job record
// @cb    {Function}  The function to execute once finished
//
Job.prototype.complete = function (cb) {
  request.put({ url: this.url() + '/complete', body: {job: this} }, function (err, res, body) {
    if (err) {
      cb(err);
    } else {
      if (res.statusCode !== 201) {
        cb(new Error(body));
      } else {
        cb(null);
      }
    }
  });
};

Job.prototype.generateDone = function() {
  var self = this;
  return function(err) {
    if(err) {
      self.reportError(err);
    } else {
      self.complete();
    }
  };
};


module.exports = Job;