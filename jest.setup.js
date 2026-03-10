// Set environment variables FIRST, before any imports
// This ensures modules that read env vars at load time get the correct values
process.env.CHAT_ENCRYPTION_KEY = 'a'.repeat(64);
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

import '@testing-library/jest-dom'

// Polyfill for Request, Response, Headers for Next.js API route testing
import { TextEncoder, TextDecoder } from 'util'

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock fetch
if (typeof global.fetch === 'undefined') {
  global.fetch = jest.fn()
}

// Synchronous polyfill setup for Web APIs
// These need to be defined BEFORE any tests import next/server

// Mock Headers class
class MockHeaders {
  constructor(init = {}) {
    this._headers = new Map()
    if (init) {
      if (Array.isArray(init)) {
        init.forEach(([key, value]) => this._headers.set(key.toLowerCase(), String(value)))
      } else if (init instanceof MockHeaders) {
        init._headers.forEach((value, key) => this._headers.set(key, value))
      } else if (typeof init === 'object') {
        Object.entries(init).forEach(([key, value]) => this._headers.set(key.toLowerCase(), String(value)))
      }
    }
  }
  get(name) { return this._headers.get(name.toLowerCase()) || null }
  set(name, value) { this._headers.set(name.toLowerCase(), String(value)) }
  has(name) { return this._headers.has(name.toLowerCase()) }
  delete(name) { this._headers.delete(name.toLowerCase()) }
  append(name, value) { 
    const existing = this._headers.get(name.toLowerCase())
    this._headers.set(name.toLowerCase(), existing ? `${existing}, ${value}` : String(value))
  }
  entries() { return this._headers.entries() }
  keys() { return this._headers.keys() }
  values() { return this._headers.values() }
  forEach(callback) { this._headers.forEach((value, key) => callback(value, key, this)) }
  [Symbol.iterator]() { return this._headers.entries() }
}

// Mock Response class
class MockResponse {
  constructor(body, init = {}) {
    this._body = body
    this._status = init.status || 200
    this._statusText = init.statusText || 'OK'
    this._headers = new MockHeaders(init.headers || {})
    this._ok = this._status >= 200 && this._status < 300
    this._type = 'basic'
    this._url = init.url || ''
    this._redirected = false
  }
  get status() { return this._status }
  get statusText() { return this._statusText }
  get headers() { return this._headers }
  get ok() { return this._ok }
  get type() { return this._type }
  get url() { return this._url }
  get redirected() { return this._redirected }
  get body() { return null }
  get bodyUsed() { return false }
  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body
  }
  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
  }
  async arrayBuffer() {
    const text = await this.text()
    const encoder = new TextEncoder()
    return encoder.encode(text).buffer
  }
  async blob() {
    return { size: 0, type: '' }
  }
  clone() {
    return new MockResponse(this._body, {
      status: this._status,
      statusText: this._statusText,
      headers: this._headers
    })
  }
  static json(data, init = {}) {
    const headers = new MockHeaders(init.headers || {})
    headers.set('content-type', 'application/json')
    return new MockResponse(JSON.stringify(data), { ...init, headers })
  }
  static error() {
    const response = new MockResponse(null, { status: 0, statusText: '' })
    response._type = 'error'
    return response
  }
  static redirect(url, status = 302) {
    const headers = new MockHeaders({ location: url })
    return new MockResponse(null, { status, headers })
  }
}

// Mock Request class  
class MockRequest {
  constructor(input, init = {}) {
    // Handle input
    if (typeof input === 'string') {
      this._url = input
    } else if (input instanceof MockRequest) {
      this._url = input._url
      init = { ...input._init, ...init }
    } else if (input && typeof input === 'object' && input.url) {
      this._url = input.url
    } else {
      this._url = String(input || '')
    }
    
    this._init = init
    this._method = (init.method || 'GET').toUpperCase()
    this._headers = new MockHeaders(init.headers || {})
    this._body = init.body !== undefined ? init.body : null
    this._mode = init.mode || 'cors'
    this._credentials = init.credentials || 'same-origin'
    this._cache = init.cache || 'default'
    this._redirect = init.redirect || 'follow'
    this._referrer = init.referrer || 'about:client'
    this._integrity = init.integrity || ''
    this._signal = init.signal || null
  }
  get url() { return this._url }
  get method() { return this._method }
  get headers() { return this._headers }
  get body() { return null }
  get bodyUsed() { return false }
  get mode() { return this._mode }
  get credentials() { return this._credentials }
  get cache() { return this._cache }
  get redirect() { return this._redirect }
  get referrer() { return this._referrer }
  get integrity() { return this._integrity }
  get signal() { return this._signal }
  async json() {
    if (this._body === null || this._body === undefined) return {}
    if (typeof this._body === 'string') return JSON.parse(this._body)
    return this._body
  }
  async text() {
    if (this._body === null || this._body === undefined) return ''
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body)
  }
  async arrayBuffer() {
    const text = await this.text()
    const encoder = new TextEncoder()
    return encoder.encode(text).buffer
  }
  async formData() {
    return new Map()
  }
  clone() {
    return new MockRequest(this._url, {
      method: this._method,
      headers: this._headers,
      body: this._body,
      mode: this._mode,
      credentials: this._credentials,
      cache: this._cache,
      redirect: this._redirect,
      referrer: this._referrer,
      integrity: this._integrity,
      signal: this._signal
    })
  }
}

// Set global polyfills
if (typeof global.Headers === 'undefined') {
  global.Headers = MockHeaders
}
if (typeof global.Response === 'undefined') {
  global.Response = MockResponse
}
if (typeof global.Request === 'undefined') {
  global.Request = MockRequest
}

// Mock RTCPeerConnection
class MockRTCPeerConnection {
  constructor(config) {
    this.config = config
    this.localDescription = null
    this.remoteDescription = null
    this.connectionState = 'new'
    this.iceConnectionState = 'new'
    this.signalingState = 'stable'
    this._senders = []
    this._receivers = []
    this.onicecandidate = null
    this.ontrack = null
    this.onconnectionstatechange = null
    this.oniceconnectionstatechange = null
  }
  
  async createOffer() {
    return { type: 'offer', sdp: 'mock-sdp-offer' }
  }
  
  async createAnswer() {
    return { type: 'answer', sdp: 'mock-sdp-answer' }
  }
  
  async setLocalDescription(desc) {
    this.localDescription = desc
  }
  
  async setRemoteDescription(desc) {
    this.remoteDescription = desc
  }
  
  addTrack(track, stream) {
    const sender = { track, replaceTrack: jest.fn() }
    this._senders.push(sender)
    return sender
  }
  
  removeTrack(sender) {
    const index = this._senders.indexOf(sender)
    if (index > -1) {
      this._senders.splice(index, 1)
    }
  }
  
  getSenders() {
    return this._senders
  }
  
  getReceivers() {
    return this._receivers
  }
  
  close() {
    this.connectionState = 'closed'
  }
  
  addIceCandidate(candidate) {
    return Promise.resolve()
  }
}

class MockRTCSessionDescription {
  constructor(init) {
    this.type = init.type
    this.sdp = init.sdp
  }
}

class MockRTCIceCandidate {
  constructor(init) {
    this.candidate = init.candidate
    this.sdpMid = init.sdpMid
    this.sdpMLineIndex = init.sdpMLineIndex
  }
}

// Mock MediaStream
class MockMediaStream {
  constructor(tracks = []) {
    this._tracks = tracks
    this.id = 'mock-stream-' + Math.random().toString(36).substr(2, 9)
  }
  
  getTracks() {
    return this._tracks
  }
  
  getVideoTracks() {
    return this._tracks.filter(t => t.kind === 'video')
  }
  
  getAudioTracks() {
    return this._tracks.filter(t => t.kind === 'audio')
  }
  
  addTrack(track) {
    this._tracks.push(track)
  }
  
  removeTrack(track) {
    const index = this._tracks.indexOf(track)
    if (index > -1) {
      this._tracks.splice(index, 1)
    }
  }
}

// Mock MediaStreamTrack
class MockMediaStreamTrack {
  constructor(kind = 'video') {
    this.kind = kind
    this.id = 'mock-track-' + Math.random().toString(36).substr(2, 9)
    this.enabled = true
    this.muted = false
    this.readyState = 'live'
  }
  
  stop() {
    this.readyState = 'ended'
  }
  
  clone() {
    return new MockMediaStreamTrack(this.kind)
  }
}

if (typeof global.RTCPeerConnection === 'undefined') {
  global.RTCPeerConnection = MockRTCPeerConnection
}
if (typeof global.RTCSessionDescription === 'undefined') {
  global.RTCSessionDescription = MockRTCSessionDescription
}
if (typeof global.RTCIceCandidate === 'undefined') {
  global.RTCIceCandidate = MockRTCIceCandidate
}
if (typeof global.MediaStream === 'undefined') {
  global.MediaStream = MockMediaStream
}
if (typeof global.MediaStreamTrack === 'undefined') {
  global.MediaStreamTrack = MockMediaStreamTrack
}

// Mock navigator.mediaDevices
if (typeof navigator === 'undefined') {
  global.navigator = {}
}
if (!navigator.mediaDevices) {
  navigator.mediaDevices = {
    getUserMedia: jest.fn().mockResolvedValue(
      new MockMediaStream([
        new MockMediaStreamTrack('video'),
        new MockMediaStreamTrack('audio')
      ])
    ),
    getDisplayMedia: jest.fn().mockResolvedValue(
      new MockMediaStream([new MockMediaStreamTrack('video')])
    ),
    enumerateDevices: jest.fn().mockResolvedValue([])
  }
}
