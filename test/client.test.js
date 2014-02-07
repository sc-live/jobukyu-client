'use strict';

var queueApi = require('../');
var assert   = require('assert');
var async    = require('async');

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

  describe('waitForJob()', function() {

    beforeEach(function() {
      queueApi.free();
    });

    this.timeout(5 * 1000);

    var takeJobData = { type: 'jobukyu_test_waitforjob_take' };
    var completeJobData = {
      type: 'jobukyu_test_waitforjob_complete',
      metadata: {
        dataToSendWhenFailed: { event:'error', progress: { data: null }},
        dataToSendWhenProcessing: { event: 'processing', progress: { data: null }}
      },
      webhooks            : {
        processing        : [{method: 'PUT', url: 'http://logserver/api/log/process_pdf/processing', data: 'dataToSendWhenProcessing'}],
        completed         : [{method: 'PUT', url: 'http://logserver/api/log/completed',  data: 'dataToSend'}],
        failed            : [{method: 'PUT', url: 'http://logserver/api/log/progress', data: { event: 'failed' }}]
      }
    };

    var errorJobData = {
      type: 'jobukyu_test_waitforjob_error',
      metadata: {
        dataToSendWhenFailed: { event:'error', progress: { data: null }},
        dataToSendWhenProcessing: { event: 'processing', progress: { data: null }}
      },
      webhooks            : {
        processing        : [{method: 'PUT', url: 'http://logserver/api/log/process_pdf/processing', data: 'dataToSendWhenProcessing'}],
        completed         : [{method: 'PUT', url: 'http://logserver/api/log/completed',  data: 'dataToSend'}],
        failed            : [{method: 'PUT', url: 'http://logserver/api/log/progress', data: { event: 'failed' }}]
      }
    };

    before(function(done) {
      async.parallel([function(done) {
        queueApi.createJob(takeJobData, done);
      }, function(done) {
        queueApi.createJob(completeJobData, done);
      }, function(done) {
        queueApi.createJob(errorJobData, done);
      }], done);
    });

    it('should call the worker function when able to take a job', function(done) {
      queueApi.waitForJob(takeJobData.type, function(job) {
        assert.equal(job.type, takeJobData.type);
        done();
      });
    });

    it('should report complete if callback called without err', function(done) {
      queueApi.waitForJob(completeJobData.type, function(job, jobDone) {
        assert.equal(job.type, completeJobData.type);
        jobDone(done);
      });
    });

    it('should report an error if an instance of err is given to callback', function(done) {
      queueApi.waitForJob(errorJobData.type, function(job, jobDone) {
        assert.equal(job.type, errorJobData.type);
        jobDone(new Error('Test Error', done));
      });
    });

  });


});