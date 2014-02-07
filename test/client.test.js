'use strict';

var queueApi = require('../');
var assert   = require('assert');
var request  = require('request');

describe('jobukyu-client', function() {

  describe('[set|get]JobQueueUrl', function() {

    var originalQueueUrl = queueApi.jobQueueUrl;
    var tempQueueUrl = 'http://jobqueuehost:3900';

    afterEach(function() {
      queueApi.jobQueueUrl = originalQueueUrl;
    });

    it('should return callback if provided (should be depreciated)', function(done) {
      queueApi.setJobQueueUrl(tempQueueUrl, done);
      assert.equal(queueApi.getJobQueueUrl(), tempQueueUrl);
    });

    it('should allow a change without callback', function() {
      queueApi.setJobQueueUrl(tempQueueUrl);
      assert.equal(queueApi.getJobQueueUrl(), tempQueueUrl);
    });

  });

  describe('createJob', function() {

  });

  describe('defineProgress', function() {

  });

  describe('defineError', function() {

  });

  describe('completeJob', function() {

  });

  describe('getJobFromQueue', function() {

    beforeEach(function(done) {
      // Create Job
    });

    it('should take a job from queue based on name', function(done) {
      queueApi.getJobFromQueue('jobukyu_test_getjobfromqueue', function(err, job) {
        assert.ifError(err);
        // assert job data
        done();
      });
    });
  });


});