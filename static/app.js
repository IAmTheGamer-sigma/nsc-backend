const SERVER = window.location.origin;
const socket = io(SERVER);

let currentUser = null;
let pc = null;
let localStream = null;

// --------------------
// LOGIN
// --------------------
async function login() {
  const id = document.getElementById("id").value;
  const pin = document.getElementById("pin").value;

  const res = await fetch(SERVER + "/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, pin })
  });

  const data = await res.json();

  if (data.status === "ok") {
    currentUser = id;

    document.getElementById("login").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    socket.emit("join", { id });
  } else {
    alert("Login failed");
  }
}

// --------------------
// CHAT
// --------------------
function send() {
  const msgInput = document.getElementById("msg");
  const text = msgInput.value;

  if (!text) return;

  socket.emit("message", {
    user: currentUser,
    text: text
  });

  msgInput.value = "";
}

socket.on("message", (msg) => {
  const box = document.getElementById("messages");
  box.innerHTML += `<div><b>${msg.user}:</b> ${msg.text}</div>`;
  box.scrollTop = box.scrollHeight;
});

// --------------------
// CALLS (WEBRTC + TURN)
// --------------------
async function startCall() {
  // Create peer connection
  pc = new RTCPeerConnection({
    iceServers: [
      // STUN (free)
      { urls: "stun:stun.l.google.com:19302" },

      // TURN (USE YOUR CREDENTIALS)
      {
        urls: [
          "turn:openrelay.metered.ca:80",
          "turn:openrelay.metered.ca:443",
          "turns:openrelay.metered.ca:443"
        ],
        username: "c0bd9533f39d82922c4ac0c7",
        credential: "DM2JEYPmD7RBNBxG"
      }
    ]
  });

  // Get camera + mic
  localStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById("local").srcObject = localStream;

  // Add tracks
  localStream.getTracks().forEach(track => {
    pc.addTrack(track, localStream);
  });

  // Receive remote stream
  pc.ontrack = (event) => {
    document.getElementById("remote").srcObject = event.streams[0];
  };

  // Send ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", {
        type: "candidate",
        candidate: event.candidate
      });
    }
  };

  // Create offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);

  socket.emit("signal", {
    type: "offer",
    offer: offer
  });
}

// --------------------
// SIGNALING (VERY IMPORTANT)
// --------------------
socket.on("signal", async (data) => {
  if (!pc) return;

  // OFFER
  if (data.type === "offer") {
    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("signal", {
      type: "answer",
      answer: answer
    });
  }

  // ANSWER
  else if (data.type === "answer") {
    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
  }

  // ICE
  else if (data.type === "candidate") {
    try {
      await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
    } catch (e) {
      console.error("ICE error:", e);
    }
  }
});

// --------------------
// UI SWITCHING
// --------------------
function show(tab) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(tab).classList.remove("hidden");
}
