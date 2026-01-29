/**
 * WebRTC Peer Connection Manager
 * Handles RTCPeerConnection lifecycle, media devices, and stream management
 */

export interface WebRTCConfig {
  iceServers: RTCIceServer[];
}

/**
 * Default STUN servers for NAT traversal
 */
const DEFAULT_STUN_SERVERS: RTCIceServer[] = [
  { urls: ["stun:stun.l.google.com:19302"] },
  { urls: ["stun:stun1.l.google.com:19302"] },
  { urls: ["stun:stun2.l.google.com:19302"] },
];

/**
 * Get WebRTC configuration with STUN/TURN servers
 * Supports environment-based configuration for custom TURN servers
 */
export function getWebRTCConfig(): WebRTCConfig {
  const iceServers: RTCIceServer[] = [...DEFAULT_STUN_SERVERS];

  // Add TURN server if configured in environment
  if (process.env.NEXT_PUBLIC_TURN_SERVER) {
    iceServers.push({
      urls: [process.env.NEXT_PUBLIC_TURN_SERVER],
      username: process.env.NEXT_PUBLIC_TURN_USERNAME,
      credential: process.env.NEXT_PUBLIC_TURN_PASSWORD,
    });
  }

  return { iceServers };
}

export class PeerConnection {
  private pc: RTCPeerConnection;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream = new MediaStream();
  private config: WebRTCConfig;
  private onIceCandidate:
    | ((candidate: RTCIceCandidate) => Promise<void>)
    | null = null;
  private onRemoteStream: ((stream: MediaStream) => void) | null = null;
  private onConnectionStateChange:
    | ((state: RTCPeerConnectionState) => void)
    | null = null;
  private onError: ((error: Error) => void) | null = null;

  constructor(config?: WebRTCConfig) {
    this.config = config || getWebRTCConfig();

    this.pc = new RTCPeerConnection({
      iceServers: this.config.iceServers,
    });

    this.setupEventHandlers();
  }

  /**
   * Setup internal event handlers
   */
  private setupEventHandlers(): void {
    // ICE candidate generation
    this.pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        console.log("[WebRTC] ICE candidate generated");
        this.onIceCandidate?.(event.candidate).catch((err) => {
          console.error("[WebRTC] Error sending ICE candidate:", err);
        });
      }
    };

    // Remote stream reception
    this.pc.ontrack = (event: RTCTrackEvent) => {
      console.log("[WebRTC] Remote track received:", event.track.kind);
      if (event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.onRemoteStream?.(this.remoteStream);
      }
    };

    // Connection state changes
    this.pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", this.pc.connectionState);
      this.onConnectionStateChange?.(this.pc.connectionState);

      if (
        this.pc.connectionState === "failed" ||
        this.pc.connectionState === "disconnected" ||
        this.pc.connectionState === "closed"
      ) {
        this.onError?.(
          new Error(`Connection state: ${this.pc.connectionState}`)
        );
      }
    };

    // ICE connection state (for debugging)
    this.pc.oniceconnectionstatechange = () => {
      console.log("[WebRTC] ICE connection state:", this.pc.iceConnectionState);
    };

    // Signaling state (for debugging)
    this.pc.onsignalingstatechange = () => {
      console.log("[WebRTC] Signaling state:", this.pc.signalingState);
    };
  }

  /**
   * Get user media (camera/microphone)
   */
  async getLocalStream(
    audio: boolean = true,
    video: boolean = true
  ): Promise<MediaStream | null> {
    try {
      // If we don't have a local stream, request it
      if (!this.localStream || !this.localStream.active) {
        // First try to get available devices
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasAudio = devices.some((device) => device.kind === "audioinput");
        const hasVideo = devices.some((device) => device.kind === "videoinput");

        console.log(
          "[WebRTC] Available devices - Audio:",
          hasAudio,
          "Video:",
          hasVideo
        );

        const constraints: MediaStreamConstraints = {
          audio:
            audio && hasAudio
              ? { echoCancellation: true, noiseSuppression: true }
              : false,
          video:
            video && hasVideo
              ? { width: { ideal: 1280 }, height: { ideal: 720 } }
              : false,
        };

        if (!constraints.audio && !constraints.video) {
          throw new Error("No audio or video devices available");
        }

        console.log("[WebRTC] Requesting getUserMedia...");
        this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("[WebRTC] getUserMedia successful");
      } else {
        console.log("[WebRTC] Reusing existing local stream");
      }

      // Check peer connection state and recreate if necessary
      if (
        this.pc.connectionState === "closed" ||
        this.pc.signalingState === "closed"
      ) {
        console.warn("[WebRTC] Peer connection was closed, recreating...");
        this.pc = new RTCPeerConnection({
          iceServers: this.config.iceServers,
        });
        this.setupEventHandlers();
      }

      // Always ensure tracks are added to peer connection (handles both new and reused streams)
      const senders = this.pc.getSenders();
      this.localStream.getTracks().forEach((track) => {
        // Check if this track is already added
        const existingSender = senders.find((s) => s.track?.id === track.id);
        if (!existingSender) {
          console.log("[WebRTC] Adding local track:", track.kind);
          try {
            this.pc.addTrack(track, this.localStream!);
          } catch (err) {
            console.error("[WebRTC] Error adding track:", err);
            // If we get an error, the peer connection might be in a bad state
            throw new Error(
              `Failed to add ${track.kind} track to peer connection`
            );
          }
        } else {
          console.log("[WebRTC] Track already added:", track.kind);
        }
      });

      console.log("[WebRTC] Local stream acquired and tracks added to peer connection");
      return this.localStream;
    } catch (error) {
      console.error("[WebRTC] Error getting user media:", error);
      const err =
        error instanceof Error ? error : new Error("Failed to get user media");
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Stop local media tracks
   */
  stopLocalStream(): void {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        console.log("[WebRTC] Stopping local track:", track.kind);
        track.stop();
      });
      this.localStream = null;
    }
  }

  /**
   * Set an existing media stream and add its tracks to the peer connection
   * Used when reusing a stream from a previous connection
   */
  setLocalStream(stream: MediaStream): void {
    console.log("[WebRTC] Setting existing local stream");
    this.localStream = stream;
    
    // Add all tracks to the peer connection
    const senders = this.pc.getSenders();
    stream.getTracks().forEach((track) => {
      const existingSender = senders.find((s) => s.track?.id === track.id);
      if (!existingSender) {
        console.log("[WebRTC] Adding track to peer connection:", track.kind);
        this.pc.addTrack(track, stream);
      } else {
        console.log("[WebRTC] Track already added:", track.kind);
      }
    });
  }

  /**
   * Create SDP offer (caller side)
   */
  async createOffer(): Promise<RTCSessionDescriptionInit> {
    try {
      const offer = await this.pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.pc.setLocalDescription(offer);
      console.log("[WebRTC] SDP offer created");
      return {
        type: offer.type,
        sdp: offer.sdp,
      };
    } catch (error) {
      console.error("[WebRTC] Error creating offer:", error);
      const err =
        error instanceof Error ? error : new Error("Failed to create offer");
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Create SDP answer (callee side)
   */
  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    try {
      const answer = await this.pc.createAnswer();
      await this.pc.setLocalDescription(answer);
      console.log("[WebRTC] SDP answer created");
      return {
        type: answer.type,
        sdp: answer.sdp,
      };
    } catch (error) {
      console.error("[WebRTC] Error creating answer:", error);
      const err =
        error instanceof Error ? error : new Error("Failed to create answer");
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Set remote SDP offer/answer
   */
  async setRemoteDescription(
    description: RTCSessionDescription
  ): Promise<void> {
    try {
      await this.pc.setRemoteDescription(
        new RTCSessionDescription(description)
      );
      console.log(`[WebRTC] Remote ${description.type} set`);
    } catch (error) {
      console.error("[WebRTC] Error setting remote description:", error);
      const err =
        error instanceof Error
          ? error
          : new Error("Failed to set remote description");
      this.onError?.(err);
      throw err;
    }
  }

  /**
   * Add ICE candidate
   */
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      if (this.pc.remoteDescription) {
        await this.pc.addIceCandidate(new RTCIceCandidate(candidate));
        console.log("[WebRTC] ICE candidate added");
      } else {
        console.warn(
          "[WebRTC] Ignoring ICE candidate - no remote description set yet"
        );
      }
    } catch (error) {
      console.error("[WebRTC] Error adding ICE candidate:", error);
      // Don't throw - ICE candidate errors shouldn't crash the call
    }
  }

  /**
   * Get local stream
   */
  getLocalMediaStream(): MediaStream | null {
    return this.localStream;
  }

  /**
   * Get remote stream
   */
  getRemoteMediaStream(): MediaStream {
    return this.remoteStream;
  }

  /**
   * Get connection state
   */
  getConnectionState(): RTCPeerConnectionState {
    return this.pc.connectionState;
  }

  /**
   * Get ICE connection state
   */
  getIceConnectionState(): RTCIceConnectionState {
    return this.pc.iceConnectionState;
  }

  /**
   * Mute audio
   */
  muteAudio(mute: boolean): boolean {
    if (!this.localStream) return false;

    this.localStream.getAudioTracks().forEach((track) => {
      track.enabled = !mute;
    });

    console.log(`[WebRTC] Audio ${mute ? "muted" : "unmuted"}`);
    return true;
  }

  /**
   * Disable video camera
   */
  disableVideo(disable: boolean): boolean {
    if (!this.localStream) return false;

    this.localStream.getVideoTracks().forEach((track) => {
      track.enabled = !disable;
    });

    console.log(`[WebRTC] Video ${disable ? "disabled" : "enabled"}`);
    return true;
  }

  /**
   * Get audio status
   */
  isAudioMuted(): boolean {
    if (!this.localStream) return true;
    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? !audioTrack.enabled : true;
  }

  /**
   * Get video status
   */
  isVideoDisabled(): boolean {
    if (!this.localStream) return true;
    const videoTrack = this.localStream.getVideoTracks()[0];
    return videoTrack ? !videoTrack.enabled : true;
  }

  /**
   * Register ICE candidate callback
   */
  onIceCandidateHandler(
    handler: (candidate: RTCIceCandidate) => Promise<void>
  ): void {
    this.onIceCandidate = handler;
  }

  /**
   * Register remote stream callback
   */
  onRemoteStreamHandler(handler: (stream: MediaStream) => void): void {
    this.onRemoteStream = handler;
  }

  /**
   * Register connection state change callback
   */
  onConnectionStateChangeHandler(
    handler: (state: RTCPeerConnectionState) => void
  ): void {
    this.onConnectionStateChange = handler;
  }

  /**
   * Register error callback
   */
  onErrorHandler(handler: (error: Error) => void): void {
    this.onError = handler;
  }

  /**
   * Get connection stats
   */
  async getStats(): Promise<RTCStatsReport> {
    return await this.pc.getStats();
  }

  /**
   * Cleanup and close connection
   */
  close(): void {
    this.stopLocalStream();

    if (this.pc) {
      this.pc.close();
      console.log("[WebRTC] Peer connection closed");
    }
  }
}

/**
 * Helper function to check if browser supports WebRTC
 */
export function isWebRTCSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    !!(
      navigator.mediaDevices?.getUserMedia ||
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia
    ) &&
    !!(
      typeof RTCPeerConnection !== "undefined" ||
      typeof (window as any).webkitRTCPeerConnection !== "undefined" ||
      typeof (window as any).mozRTCPeerConnection !== "undefined"
    )
  );
}
