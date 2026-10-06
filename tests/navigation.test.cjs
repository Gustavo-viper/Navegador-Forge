const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveAddress, isWebUrl, describeLoadError } = require('../electron/navigation.cjs');

test('keeps explicit HTTP and HTTPS addresses', () => {
  assert.equal(resolveAddress(' https://github.com/path '), 'https://github.com/path');
  assert.equal(resolveAddress('http://example.com'), 'http://example.com/');
});

test('recognizes domains and local development hosts', () => {
  assert.equal(resolveAddress('example.com'), 'https://example.com/');
  assert.equal(resolveAddress('example.com:8443/test'), 'https://example.com:8443/test');
  assert.equal(resolveAddress('localhost:5173'), 'http://localhost:5173/');
  assert.equal(resolveAddress('127.0.0.1:3000'), 'http://127.0.0.1:3000/');
});

test('searches text with the configured engine', () => {
  assert.equal(resolveAddress('jogos forge', 'DuckDuckGo'), 'https://duckduckgo.com/?q=jogos%20forge');
  assert.equal(resolveAddress('busca', 'Bing'), 'https://www.bing.com/search?q=busca');
});

test('rejects privileged and malformed schemes', () => {
  assert.throws(() => resolveAddress('javascript:alert(1)'));
  assert.throws(() => resolveAddress('file:///C:/secret.txt'));
  assert.throws(() => resolveAddress('data:text/html,hi'));
  assert.throws(() => resolveAddress('http://'));
  assert.equal(isWebUrl('https://example.com'), true);
  assert.equal(isWebUrl('file:///tmp/test'), false);
});

test('classifies navigation errors for the internal error page', () => {
  assert.equal(describeLoadError(-105), 'not-found');
  assert.equal(describeLoadError(-200), 'certificate');
  assert.equal(describeLoadError(-106), 'connection');
});