'use strict';

var assert        = require('assert');
var jobukyuClient = require('../');

describe('jobukyu-client', function() {

  describe('creating a client', function() {
    it('should create an instance of Client', function() {
      assert(jobukyuClient() instanceof jobukyuClient.Client);
    });
    it('should accept a url', function() {
      var queueUrl = 'http://jobqueuehost:2213';
      var client = jobukyuClient(queueUrl);
      assert.equal(client.jobQueueUrl, queueUrl);
    });
  });

  describe('Client', function() {

    describe('.createJob()', function() {
      it('should create a job in the queue');
    });

    describe('.findAvailableJob()', function() {
      it('should provide a null results if not matching jobs');
      it('should provide a Job instance on matching job');
    });

    describe('.getJobFromQueue()', function() {
      it('should provide null if no jobs');
      it('should provide a Job instance and mark as taken if jobs found');
    });

    describe('.free()', function() {
      it('should set client.idle to true', function() {
        var client = jobukyuClient();
        client.idle = false;
        client.free();
        assert.equal(client.idle, true);
      });
    });
  });

  describe('Job', function() {

    describe('.url()', function() {
      it('should return the queue url with base job path');
    });

    describe('.take()', function() {
      it('should make the job unavailable');
    });

    describe('.reportProgress()', function() {
      it('should inform given webhook on progress');
    });

    describe('.reportError()', function() {
      it('should inform given webook and queue');
    });

    describe('.complete()', function() {
      it('should inform given webook and queue');
    });

    describe('.generateDone()', function() {
      it('should return a function');
      it('should reportError when err given to returned function');
      it('should reportComplete when no err given to returned function');
    });

  });

});