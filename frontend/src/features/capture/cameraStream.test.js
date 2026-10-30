import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildConstraintAttempts,
  isPermissionError,
  getStreamWithFallback,
  shouldAutoRetry,
} from './cameraStream.js';

test('1. buildConstraintAttempts returns three attempts ordered from most to least demanding', () => {
  const attempts = buildConstraintAttempts('user');
  assert.equal(attempts.length, 3);
  assert.deepEqual(attempts[0], {
    video: { facingMode: { ideal: 'user' }, width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: false,
  });
  assert.deepEqual(attempts[1], {
    video: { facingMode: { ideal: 'user' } },
    audio: false,
  });
  assert.deepEqual(attempts[2], {
    video: true,
    audio: false,
  });
});

test('2. getStreamWithFallback returns stream from first successful attempt', async () => {
  const fakeStream = { id: 'stream-1' };
  let calls = 0;
  const mockGetUserMedia = async (_constraints) => {
    calls++;
    return fakeStream;
  };
  const stream = await getStreamWithFallback({
    facingMode: 'environment',
    getUserMedia: mockGetUserMedia,
    sleep: async () => {},
  });
  assert.equal(stream, fakeStream);
  assert.equal(calls, 1);
});

test('3. getStreamWithFallback retries after failure, falls to next constraint set, and succeeds on { video: true }', async () => {
  const fakeStream = { id: 'stream-fallback' };
  const calls = [];
  const mockGetUserMedia = async (constraints) => {
    calls.push(constraints);
    // Fail first attempt (2 retries) with OverconstrainedError
    // Fail second attempt (2 retries) with NotReadableError
    // Succeed on third attempt
    if (calls.length <= 2) {
      const err = new Error('Overconstrained');
      err.name = 'OverconstrainedError';
      throw err;
    }
    if (calls.length <= 4) {
      const err = new Error('Not readable');
      err.name = 'NotReadableError';
      throw err;
    }
    return fakeStream;
  };

  let sleepCount = 0;
  const mockSleep = async () => {
    sleepCount++;
  };

  const stream = await getStreamWithFallback({
    facingMode: 'user',
    getUserMedia: mockGetUserMedia,
    sleep: mockSleep,
    retriesPerAttempt: 2,
    retryDelayMs: 10,
  });

  assert.equal(stream, fakeStream);
  assert.equal(calls.length, 5);
  assert.deepEqual(calls[4], { video: true, audio: false });
  assert.equal(sleepCount, 4);
});

test('4. NotAllowedError and SecurityError throw immediately without retries', async () => {
  for (const errorName of ['NotAllowedError', 'SecurityError']) {
    let callCount = 0;
    const mockGetUserMedia = async () => {
      callCount++;
      const err = new Error('Permission denied');
      err.name = errorName;
      throw err;
    };

    let threw = false;
    try {
      await getStreamWithFallback({
        facingMode: 'user',
        getUserMedia: mockGetUserMedia,
        sleep: async () => {},
      });
    } catch (err) {
      threw = true;
      assert.equal(err.name, errorName);
    }
    assert.equal(threw, true);
    assert.equal(callCount, 1, `Expected 1 call for ${errorName}, got ${callCount}`);
  }
});

test('5. If every attempt fails, getStreamWithFallback throws the last error', async () => {
  let callCount = 0;
  const mockGetUserMedia = async () => {
    callCount++;
    const err = new Error(`Attempt ${callCount} failed`);
    err.name = 'AbortError';
    throw err;
  };

  let caughtErr = null;
  try {
    await getStreamWithFallback({
      facingMode: 'environment',
      getUserMedia: mockGetUserMedia,
      sleep: async () => {},
      retriesPerAttempt: 2,
    });
  } catch (err) {
    caughtErr = err;
  }

  assert.ok(caughtErr);
  assert.equal(caughtErr.message, 'Attempt 6 failed');
  assert.equal(callCount, 6); // 3 constraint sets * 2 retries
});

test('6. shouldAutoRetry: checks videoWidth, readyState, and retry count', () => {
  // true when videoWidth is 0 and retries < maxRetries
  assert.equal(shouldAutoRetry({ videoWidth: 0, readyState: 4, retries: 0, maxRetries: 2 }), true);
  assert.equal(shouldAutoRetry({ videoWidth: 0, readyState: 4, retries: 1, maxRetries: 2 }), true);

  // true when readyState < 2 and retries < maxRetries
  assert.equal(shouldAutoRetry({ videoWidth: 1280, readyState: 1, retries: 0, maxRetries: 2 }), true);
  assert.equal(shouldAutoRetry({ videoWidth: 1280, readyState: 0, retries: 1, maxRetries: 2 }), true);

  // false when picture is fine (videoWidth > 0 and readyState >= 2)
  assert.equal(shouldAutoRetry({ videoWidth: 1280, readyState: 2, retries: 0, maxRetries: 2 }), false);
  assert.equal(shouldAutoRetry({ videoWidth: 1920, readyState: 4, retries: 0, maxRetries: 2 }), false);

  // false when retries are used up
  assert.equal(shouldAutoRetry({ videoWidth: 0, readyState: 4, retries: 2, maxRetries: 2 }), false);
  assert.equal(shouldAutoRetry({ videoWidth: 0, readyState: 0, retries: 3, maxRetries: 2 }), false);
});

test('7. isPermissionError for NotAllowedError, SecurityError, other errors, and undefined', () => {
  assert.equal(isPermissionError({ name: 'NotAllowedError' }), true);
  assert.equal(isPermissionError({ name: 'SecurityError' }), true);
  assert.equal(isPermissionError({ name: 'OverconstrainedError' }), false);
  assert.equal(isPermissionError({ name: 'NotReadableError' }), false);
  assert.equal(isPermissionError(new Error('general')), false);
  assert.equal(isPermissionError(null), false);
  assert.equal(isPermissionError(undefined), false);
});
