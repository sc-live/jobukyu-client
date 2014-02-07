'use strict';



// Dependencies
//
var  request = require('request');



// This is a boolean flag that determines if 
// the worker is busy or free
//
var idle = true;



// Used to hold the report error function
//
var reportError = null;



// Used to hold the report progress function
//
var reportProgress = null;



// Used to track the current job, so that it can be 
// referenced in other places
//
var currentJob = null;



// Used to track the jobQueueUrl
//
var jobQueueUrl = 'http://localhost:3800';



// Sets the job queue url to a new value
//
// @url   {String}    The url to set the job queue url to
// @cb    {Function}  The function to execute once finished
//
function setJobQueueUrl (url, cb) {
  jobQueueUrl = url;
  if(cb) { cb(); }
}

// Gets the job queue url
//
// @cb    {Function}  The function to execute once finished
//
function getJobQueueUrl (cb) {
  if(cb) {
    cb(null);
  }
  return jobQueueUrl;
}


// This defines the function for reporting progress
// 
// @job     {Object}    The job record
//
function defineProgress (job) {
  reportProgress = function (progress) {
    var url = job.webhooks.processing[0].url;
    request.put({url: url, body: {progress: progress}, json: true}, function (err) {
      if (err) {
        reportError(err);
      }
    });
  };
  return reportProgress;
}



// This defines the function for reporting an error
// 
// @job     {Object}    The job record
//
function defineError (job, cbA) {
  reportError = function (err, cbB) {
    job.metadata.dataToSendWhenFailed.progress.data = err;
    request.put({url: jobQueueUrl + '/jobs/' + job._id + '/fail', body: {job: job}, json: true}, function () {
      request.put({url: jobQueueUrl + '/jobs/' + job._id + '/release', json: true}, function (resErr) {
        var cb = cbA || cbB;
        if (cb && typeof cb === 'function') {
          cb(resErr);
        } else {
          console.log(err);
          process.exit(1);
        }
      });
    });
  };

  return reportError;
}



// Finds any jobs on the queue that are available
//
// @cb    {Function}  The function to execute once finished
//
function findAvailableJob (jobType, cb) {
  var url, query;

  if (jobType) {
    url     = jobQueueUrl + '/jobs/search';
    query   = {status: 'new', type: jobType};
  } else {
    url     = jobQueueUrl + '/jobs/new';
  }

  // for now, we assume that all jobs are Process PDF
  // once we support upload to S3 jobs, then we'll need to inspect the job's type
  // in the list.
  //
  var conditions = {url: url, json: true};
  if (query) {conditions.qs = query;}

  request(conditions, function (err, res, body) {
    if (err) {
      cb(err, null);
    } else {
      if (body && body.length > 0) {
        cb(err, body[0]);
      } else {
        cb(err, null);
      }
    }
  });
}



// Takes a job from the queue
//
// @job   {Object}    The job record
// @cb    {Function}  The function to execute once finished
//
function takeJob (job, cb) {
  request.put({url: jobQueueUrl + '/jobs/' + job._id + '/take', json: true}, function (err, res, body) {
    if (err) {
      cb(err);
    } else {
      if (res.statusCode !== 201) {
        cb(new Error(body));
      } else {
        defineError(job);
        defineProgress(job);
        currentJob = job;
        cb(null);
      }
    }
  });
}



// Completes the job
//
// @job   {Object}    The job record
// @cb    {Function}  The function to execute once finished
//
function completeJob (job, cb) {
  request.put({url: jobQueueUrl + '/jobs/' + job._id + '/complete', body: {job: job}, json: true}, function (err, res, body) {
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
}


// Frees the worker
//
function free () {
  idle = true;
}

// Returns true/false depending on idle
//
function isFree () {
  return idle;
}


// Gets a job from the job queue server
//
// @jobType     {String}    The job type to fetch
// @cb          {Function}  The function to execute once finished
//
function getJobFromQueue (jobType, cb) {

  if (idle) {
    findAvailableJob(jobType, function(err, job) {
      if (err === null && job !== null) {
        takeJob(job, function (err) {
          if (err === null) {
            idle = false;
            cb(job);
          }
        });
      }
    });
  }

}

var Job = function(jobData) {
  var jobDataAttributes = Object.keys(jobData);
  for (var i = 0; i < jobDataAttributes.length; i++) {
    this[jobDataAttributes[i]] = jobData[jobDataAttributes[i]];
  }
  return this;
};

Job.prototype.progress = function(current, total) {
  defineProgress(this)((total) ? current / total * 100 : current);
};

Job.prototype.error = function(err, cb) {
  defineError(this)(err, cb);
};

Job.prototype.complete = function(cb) {
  completeJob(this, cb);
};

function waitForJob(jobType, workerFunction) {
  function pollQueue() {
    getJobFromQueue(jobType, function(jobData) {
      var job = new Job(jobData);

      workerFunction(job, function(err, cb) {
        if(err instanceof Function) {
          cb = err;
          err = undefined;
        }
        if(err) {
          job.error(err, cb);
          free();
        } else {
          job.complete(cb);
          free();
        }
      });
    });
  }

  pollQueue();

  var interval = setInterval(pollQueue, 2000);

  function stop () {
    clearInterval(interval);
  }

  return {
    interval: interval,
    pollQueue: pollQueue,
    stop: stop
  };

}


// 
// Create a job in queue
//
// @param  {Object}   jobData
// @param  {Function} callback (err)
//
// Example:
//
//  client.createJob({
//    name                : 'Process PDF for ' + customer.identifier,
//    type                : 'process_pdf',
//    metadata            : {
//      url: 'http://mys3store/uploadedpdf_asd23'
//    },
//    webhooks            : {
//      processing        : [{method: 'PUT', url: 'http://logserver/api/log/process_pdf/processing', data: 'dataToSendWhenProcessing'}],
//      completed         : [
//          {method: 'PUT', url: 'http://logserver/api/log/completed'  data: 'dataToSend'},
//          {method: 'PUT', url: 'http://myapp/api/v1/pdf/' + pdf.id + '/progress', data: {event: 'complete', data: {}}}
//      ],
//      failed            : [
//          {method: 'PUT', url: http://logserver/api/log/progress', data: { event: 'failed' }}
//      ]
//    }
//  }, function(err) {
//    if(err) return console.log('OH NO AN ERROR HAS ARRIVED AT THE PARTY:', err);
//    console.log('Job Created');
//  });
//
function createJob (jobData, callback) {
  request.post({
    url: jobQueueUrl + '/jobs',
    body: { job: jobData },
    json: true
  }, callback);
}

// Retries a job
//
//
// TODO - retryJob
// request.put({url: config.jobQueueUrl + '/jobs/' + currentJob._id + '/retry', json: true});



// Expose the public API
//
module.exports = {
  setJobQueueUrl  : setJobQueueUrl,
  getJobQueueUrl  : getJobQueueUrl,
  completeJob     : completeJob,
  getJobFromQueue : getJobFromQueue,
  defineError     : defineError,
  defineProgress  : defineProgress,
  free            : free,
  isFree          : isFree,
  waitForJob      : waitForJob,
  createJob       : createJob
};