import { useEffect, useRef, useState } from "react";

const ICE_SERVERS = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        ...(import.meta.env.VITE_TURN_URL
            ? [{
                urls: import.meta.env.VITE_TURN_URL,
                username: import.meta.env.VITE_TURN_USERNAME,
                credential: import.meta.env.VITE_TURN_CREDENTIAL,
            }]
            : []),
    ],
};

const useWebRTC = (sendSignal) => {
    const peerConnectionRef = useRef(null);
    const peerPromiseRef = useRef(null);
    const localStreamRef = useRef(null);
    const remoteStreamRef = useRef(null);
    const pendingCandidatesRef = useRef([]);
    const sendSignalRef = useRef(sendSignal);

    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [connectionState, setConnectionState] = useState("new");
    const [microPhoneEnabled, setMicroPhoneEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        sendSignalRef.current = sendSignal;
    }, [sendSignal]);

    const getLocalStream = async (callType) => {
        if (localStreamRef.current) return localStreamRef.current;

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error("Camera and microphone need HTTPS (or localhost).");
            }
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: callType === "video",
            });
            localStreamRef.current = stream;
            setLocalStream(stream);
            setMicroPhoneEnabled(true);
            setCameraEnabled(callType === "video");
            return stream;
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const buildPeerConnection = async (callType) => {
        const stream = await getLocalStream(callType);
        const pc = new RTCPeerConnection(ICE_SERVERS);
        peerConnectionRef.current = pc;

        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignalRef.current?.({
                    type: "ice_candidate",
                    candidate: event.candidate.toJSON(),
                });
            }
        };

        pc.ontrack = (event) => {
            const [incoming] = event.streams;
            if (incoming) {
                remoteStreamRef.current = incoming;
            } else {
                remoteStreamRef.current ??= new MediaStream();
                remoteStreamRef.current.addTrack(event.track);
            }
            setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
        };

        pc.onconnectionstatechange = () => setConnectionState(pc.connectionState);

        return pc;
    };

    const createPeerConnection = (callType) => {
        if (!peerPromiseRef.current) {
            peerPromiseRef.current = buildPeerConnection(callType).catch((err) => {
                peerPromiseRef.current = null;
                throw err;
            });
        }
        return peerPromiseRef.current;
    };

    const flushPendingCandidates = async (pc) => {
        const candidates = pendingCandidatesRef.current;
        pendingCandidatesRef.current = [];
        for (const candidate of candidates) {
            try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (err) {
                console.warn("Bad ICE candidate ignored:", err);
            }
        }
    };

    const startCall = async (callType) => {
        try {
            const pc = await createPeerConnection(callType);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignalRef.current?.({
                type: "offer",
                description: pc.localDescription.toJSON(),
            });
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const handleOffer = async (description, callType) => {
        try {
            const pc = await createPeerConnection(callType);
            await pc.setRemoteDescription(new RTCSessionDescription(description));
            await flushPendingCandidates(pc);
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            sendSignalRef.current?.({
                type: "answer",
                description: pc.localDescription.toJSON(),
            });
        } catch (err) {
            setError(err.message);
            throw err;
        }
    };

    const handleAnswer = async (description) => {
        const pc = peerConnectionRef.current;
        if (!pc) throw new Error("Peer connection has not been created");
        await pc.setRemoteDescription(new RTCSessionDescription(description));
        await flushPendingCandidates(pc);
    };

    const handleIceCandidate = async (candidate) => {
        const pc = peerConnectionRef.current;
        if (!pc || !pc.remoteDescription) {
            pendingCandidatesRef.current.push(candidate);
            return;
        }
        try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
            console.warn("Bad ICE candidate ignored:", err);
        }
    };

    const toggleMicrophone = () => {
        const tracks = localStreamRef.current?.getAudioTracks() ?? [];
        if (!tracks.length) return;
        const enabled = !tracks[0].enabled;
        tracks.forEach((t) => (t.enabled = enabled));
        setMicroPhoneEnabled(enabled);
    };

    const toggleCamera = () => {
        const tracks = localStreamRef.current?.getVideoTracks() ?? [];
        if (!tracks.length) return;
        const enabled = !tracks[0].enabled;
        tracks.forEach((t) => (t.enabled = enabled));
        setCameraEnabled(enabled);
    };

    const cleanup = () => {
        const pc = peerConnectionRef.current;
        if (pc) {
            pc.ontrack = null;
            pc.onicecandidate = null;
            pc.onconnectionstatechange = null;
            pc.close();
        }
        peerConnectionRef.current = null;
        peerPromiseRef.current = null;

        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        localStreamRef.current = null;
        remoteStreamRef.current = null;
        pendingCandidatesRef.current = [];

        setLocalStream(null);
        setRemoteStream(null);
        setConnectionState("new");
        setMicroPhoneEnabled(true);
        setCameraEnabled(true);
        setError(null);
    };

    const cleanupRef = useRef(cleanup);
    cleanupRef.current = cleanup;
    useEffect(() => () => cleanupRef.current(), []);

    return {
        localStream,
        remoteStream,
        connectionState,
        microPhoneEnabled,
        cameraEnabled,
        error,
        prepareCall: createPeerConnection,
        startCall,
        handleOffer,
        handleAnswer,
        handleIceCandidate,
        toggleMicrophone,
        toggleCamera,
        cleanup,
    };
};

export default useWebRTC;