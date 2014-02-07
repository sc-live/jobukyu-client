'use strict';

var queueApi = require('../');
var assert   = require('assert');

describe('jobukyu-client', function() {

  describe('[set|get]JobQueueUrl', function() {

    var originalQueueUrl = queueApi.getJobQueueUrl();
    var tempQueueUrl = 'http://jobqueuehost:3900';

    after(function() {
      queueApi.setJobQueueUrl(originalQueueUrl);
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

    var testJobData = {
      name: 'Test Job for getJobFromQueue()',
      type: 'jobukyu_test_getjobfromqueue',
      metadata: {
        nsa: 'leaks'
      }
    };

    beforeEach(function(done) {
      queueApi.createJob(testJobData, done);
    });

    afterEach(function() {
      // TODO: Delete Job
    });

    it('should take a job from queue based on type', function(done) {
      // ASK pj: shouldn't getJobFromQueue have the signature of (err, job)?
      queueApi.getJobFromQueue(testJobData.type, function(job) {
        // assert job data
        for (var i = 0; i < Object.keys(testJobData).length; i++) {
          assert.deepEqual(job[Object.keys(testJobData)[i]], testJobData[Object.keys(testJobData)[i]]);
        }
        done();
      });
    });
  });


});