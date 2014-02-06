'use strict';


//
// Dependencies
//

var request = require('./request');
var Job     = require('./job');

// Jobukyu Client
//
// @param {String} queueUrl default is 'http://localhost:9800'
//
var Client = function(queueUrl) {

  this.idle = true;

  // Holds current job instance
  this.currentJob = null;

  this.jobQueueUrl = queueUrl || 'http://localhost:9800';

  return this;
};


// Finds any jobs on the queue that are available
//
// @cb    {Function}  The function to execute once finished
//
Client.prototype.findAvailableJob = function (jobType, cb) {
  var url, query;

  if (jobType) {
    url     = this.jobQueueUrl + '/jobs/search';
    query   = {status: 'new', type: jobType};
  } else {
    url     = this.jobQueueUrl + '/jobs/new';
  }

  var conditions = {url: url, json: true};
  if (query) {conditions.qs = query;}

  request(conditions, function (err, res, body) {
    if (err) {
      cb(err, null);
    } else {
      if (body && body.length > 0) {
        cb(err, new Job(body[0]));
      } else {
        cb(err, null);
      }
    }
  });
};


// Gets a job from the job queue server
//
// @jobType     {String}    The job type to fetch
// @cb          {Function}  The function to execute once finished
//
Client.prototype.getJobFromQueue =  function (jobType, cb) {
  var self = this;
  if (self.idle) {
    self.findAvailableJob(jobType, function(err, job) {
      if (err === null && job !== null) {
        self.takeJob(job, function (err) {
          if (err === null) {
            self.idle = false;
            cb(job);
          }
        });
      }
    });
  }
};


// Sets the Client to idle (for when in use as a worker)
//
// @return {Boolean} this.idle's new results (always true)
//
Client.prototype.free = function() {
  this.idle = true;
  return this.idle;
};



var createClient = function(queueUrl) {
  return new Client(queueUrl);
};



// Retries a job
//
//
// TODO - retryJob
// request.put({url: config.jobQueueUrl + '/jobs/' + currentJob._id + '/retry', json: true});



// Expose the public API
//
module.exports        = createClient;
module.exports.Client = Client;
module.exports.Job    = Job;