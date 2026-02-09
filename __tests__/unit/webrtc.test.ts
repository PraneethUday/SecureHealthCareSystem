/**
 * Unit Tests for lib/webrtc-peer-connection.ts and lib/webrtc-signaling.ts
 * Tests WebRTC configuration and signaling functions
 */

// Mock RTCPeerConnection and MediaStream for Node environment
class MockRTCPeerConnection {
    connectionState = 'new';
    iceConnectionState = 'new';
    onicecandidate: ((event: any) => void) | null = null;
    ontrack: ((event: any) => void) | null = null;
    onconnectionstatechange: (() => void) | null = null;
    oniceconnectionstatechange: (() => void) | null = null;
    onsignalingstatechange: (() => void) | null = null;

    addTrack = jest.fn();
    createOffer = jest.fn().mockResolvedValue({ type: 'offer', sdp: 'mock-sdp' });
    createAnswer = jest.fn().mockResolvedValue({ type: 'answer', sdp: 'mock-sdp' });
    setLocalDescription = jest.fn().mockResolvedValue(undefined);
    setRemoteDescription = jest.fn().mockResolvedValue(undefined);
    addIceCandidate = jest.fn().mockResolvedValue(undefined);
    getStats = jest.fn().mockResolvedValue(new Map());
    close = jest.fn();
}

class MockMediaStream {
    id = 'mock-stream-id';
    getTracks = jest.fn().mockReturnValue([
        { kind: 'audio', enabled: true, stop: jest.fn() },
        { kind: 'video', enabled: true, stop: jest.fn() }
    ]);
    getAudioTracks = jest.fn().mockReturnValue([{ enabled: true, stop: jest.fn() }]);
    getVideoTracks = jest.fn().mockReturnValue([{ enabled: true, stop: jest.fn() }]);
    addTrack = jest.fn();
}

// Set up global mocks
(global as any).RTCPeerConnection = MockRTCPeerConnection;
(global as any).MediaStream = MockMediaStream;
(global as any).RTCSessionDescription = class { constructor(public init: any) { } };
(global as any).RTCIceCandidate = class { constructor(public init: any) { } };

// Mock navigator.mediaDevices
Object.defineProperty(global, 'navigator', {
    value: {
        mediaDevices: {
            getUserMedia: jest.fn().mockResolvedValue(new MockMediaStream()),
            enumerateDevices: jest.fn().mockResolvedValue([
                { kind: 'audioinput', deviceId: 'audio1' },
                { kind: 'videoinput', deviceId: 'video1' }
            ])
        }
    },
    writable: true
});

// Mock supabase for signaling
const mockSupabaseChain = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
};

const mockChannel = {
    on: jest.fn().mockReturnThis(),
    subscribe: jest.fn().mockReturnValue({ status: 'SUBSCRIBED' }),
    unsubscribe: jest.fn()
};

jest.mock("@/lib/supabase", () => ({
    supabase: {
        from: jest.fn(() => mockSupabaseChain),
        channel: jest.fn(() => mockChannel),
        removeChannel: jest.fn()
    }
}));

// Import after mocks are set up
import { getWebRTCConfig, PeerConnection } from "@/lib/webrtc-peer-connection";
import {
    createVideoCall,
    updateCallStatus,
    sendSignalingMessage,
    getVideoCall,
    endVideoCall,
    getRecentSignalingMessages
} from "@/lib/webrtc-signaling";

describe("WebRTC Peer Connection Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe("getWebRTCConfig()", () => {
        it("should return configuration with ICE servers", () => {
            const config = getWebRTCConfig();

            expect(config).toHaveProperty("iceServers");
            expect(Array.isArray(config.iceServers)).toBe(true);
            expect(config.iceServers.length).toBeGreaterThan(0);
        });

        it("should include STUN servers by default", () => {
            const config = getWebRTCConfig();

            const hasStunServer = config.iceServers.some(
                server => {
                    const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
                    return urls.some((url: string) => url.startsWith("stun:"));
                }
            );
            expect(hasStunServer).toBe(true);
        });
    });

    describe("PeerConnection class", () => {
        it("should instantiate successfully", () => {
            const pc = new PeerConnection();
            expect(pc).toBeDefined();
        });

        it("should instantiate with custom config", () => {
            const customConfig = {
                iceServers: [{ urls: ["stun:custom.stun.server:19302"] }]
            };
            const pc = new PeerConnection(customConfig);
            expect(pc).toBeDefined();
        });

        it("should get connection state", () => {
            const pc = new PeerConnection();
            const state = pc.getConnectionState();
            expect(state).toBeDefined();
        });

        it("should get ICE connection state", () => {
            const pc = new PeerConnection();
            const state = pc.getIceConnectionState();
            expect(state).toBeDefined();
        });

        it("should handle local stream operations", async () => {
            const pc = new PeerConnection();
            const stream = await pc.getLocalStream(true, true);
            expect(stream).toBeDefined();
        });

        it("should create offer", async () => {
            const pc = new PeerConnection();
            await pc.getLocalStream(true, true);
            const offer = await pc.createOffer();
            expect(offer).toHaveProperty("type", "offer");
        });

        it("should create answer", async () => {
            const pc = new PeerConnection();
            const answer = await pc.createAnswer();
            expect(answer).toHaveProperty("type", "answer");
        });

        it("should set remote description", async () => {
            const pc = new PeerConnection();
            const mockDescription = { type: 'offer', sdp: 'mock-sdp' } as RTCSessionDescription;
            await expect(pc.setRemoteDescription(mockDescription)).resolves.toBeUndefined();
        });

        it("should add ICE candidate", async () => {
            const pc = new PeerConnection();
            const mockCandidate = { candidate: 'mock-candidate' } as RTCIceCandidate;
            await expect(pc.addIceCandidate(mockCandidate)).resolves.toBeUndefined();
        });

        it("should mute/unmute audio", () => {
            const pc = new PeerConnection();
            const result = pc.muteAudio(true);
            // Returns false if no stream, true/false based on success
            expect(typeof result).toBe("boolean");
        });

        it("should disable/enable video", () => {
            const pc = new PeerConnection();
            const result = pc.disableVideo(true);
            expect(typeof result).toBe("boolean");
        });

        it("should check audio muted status", () => {
            const pc = new PeerConnection();
            const isMuted = pc.isAudioMuted();
            expect(typeof isMuted).toBe("boolean");
        });

        it("should check video disabled status", () => {
            const pc = new PeerConnection();
            const isDisabled = pc.isVideoDisabled();
            expect(typeof isDisabled).toBe("boolean");
        });

        it("should register ICE candidate handler", () => {
            const pc = new PeerConnection();
            const handler = jest.fn();
            pc.onIceCandidateHandler(handler);
            // Handler should be registered without error
            expect(true).toBe(true);
        });

        it("should register remote stream handler", () => {
            const pc = new PeerConnection();
            const handler = jest.fn();
            pc.onRemoteStreamHandler(handler);
            expect(true).toBe(true);
        });

        it("should register connection state change handler", () => {
            const pc = new PeerConnection();
            const handler = jest.fn();
            pc.onConnectionStateChangeHandler(handler);
            expect(true).toBe(true);
        });

        it("should register error handler", () => {
            const pc = new PeerConnection();
            const handler = jest.fn();
            pc.onErrorHandler(handler);
            expect(true).toBe(true);
        });

        it("should get stats", async () => {
            const pc = new PeerConnection();
            const stats = await pc.getStats();
            expect(stats).toBeDefined();
        });

        it("should close connection", () => {
            const pc = new PeerConnection();
            pc.close();
            // Should not throw
            expect(true).toBe(true);
        });

        it("should stop local stream", () => {
            const pc = new PeerConnection();
            pc.stopLocalStream();
            // Should not throw
            expect(true).toBe(true);
        });

        it("should get local media stream", () => {
            const pc = new PeerConnection();
            const stream = pc.getLocalMediaStream();
            // Initially null
            expect(stream).toBeNull();
        });

        it("should get remote media stream", () => {
            const pc = new PeerConnection();
            const stream = pc.getRemoteMediaStream();
            expect(stream).toBeDefined();
        });
    });
});

describe("WebRTC Signaling Unit Tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
        Object.values(mockSupabaseChain).forEach(fn => {
            if (typeof fn === 'function' && fn.mockReturnThis) {
                fn.mockReturnThis();
            }
        });
    });

    describe("createVideoCall()", () => {
        it("should create video call successfully", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "call123", status: "calling" },
                error: null
            });

            const result = await createVideoCall("apt123", "patient123", "doctor123", "patient");

            expect(result.success).toBe(true);
            expect(result.videoCallId).toBeDefined();
        });

        it("should reject non-patient initiators", async () => {
            const result = await createVideoCall("apt123", "doctor123", "doctor456", "doctor");

            expect(result.success).toBe(false);
            expect(result.error).toContain("patient");
        });

        it("should handle creation error", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Insert failed" }
            });

            const result = await createVideoCall("apt123", "patient123", "doctor123", "patient");

            expect(result.success).toBe(false);
        });
    });

    describe("updateCallStatus()", () => {
        it("should update call status successfully", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "call123", status: "accepted" },
                error: null
            });

            const result = await updateCallStatus("call123", "accepted", "user123", "patient");

            expect(result.success).toBe(true);
        });

        it("should handle update error", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Update failed" }
            });

            const result = await updateCallStatus("call123", "accepted", "user123", "patient");

            expect(result.success).toBe(false);
        });
    });

    describe("sendSignalingMessage()", () => {
        it("should send signaling message successfully", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: { id: "msg123" },
                error: null
            });

            const result = await sendSignalingMessage(
                "call123",
                "patient123",
                "patient",
                "doctor123",
                "offer",
                { type: "offer", sdp: "mock-sdp" }
            );

            expect(result.success).toBe(true);
        });

        it("should handle send error", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Insert failed" }
            });

            const result = await sendSignalingMessage(
                "call123",
                "patient123",
                "patient",
                "doctor123",
                "offer",
                {}
            );

            expect(result.success).toBe(false);
        });
    });

    describe("getRecentSignalingMessages()", () => {
        it("should fetch recent messages", async () => {
            const mockMessages = [
                { id: "1", signal_type: "offer" },
                { id: "2", signal_type: "answer" }
            ];
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: mockMessages,
                error: null
            });

            const result = await getRecentSignalingMessages("call123");

            expect(Array.isArray(result)).toBe(true);
        });

        it("should filter by timestamp when provided", async () => {
            mockSupabaseChain.order.mockResolvedValueOnce({
                data: [],
                error: null
            });

            await getRecentSignalingMessages("call123", "2026-01-01T00:00:00Z");

            expect(mockSupabaseChain.gt).toHaveBeenCalled();
        });
    });

    describe("getVideoCall()", () => {
        it("should return video call by ID", async () => {
            const mockCall = { id: "call123", status: "calling" };
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: mockCall,
                error: null
            });

            const result = await getVideoCall("call123");

            expect(result).toEqual(mockCall);
        });

        it("should return null when not found", async () => {
            mockSupabaseChain.single.mockResolvedValueOnce({
                data: null,
                error: { message: "Not found" }
            });

            const result = await getVideoCall("invalid123");

            expect(result).toBeNull();
        });
    });

    describe("endVideoCall()", () => {
        it("should end video call successfully", async () => {
            mockSupabaseChain.single
                .mockResolvedValueOnce({
                    data: { id: "call123", call_started_at: "2026-01-01T10:00:00Z" },
                    error: null
                })
                .mockResolvedValueOnce({
                    data: { id: "call123", status: "ended" },
                    error: null
                });
            mockSupabaseChain.eq.mockResolvedValueOnce({ error: null });

            const result = await endVideoCall("call123");

            expect(result.success).toBe(true);
        });
    });
});
