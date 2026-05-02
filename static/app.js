const SERVER = window.location.origin;
const socket = io(SERVER);

let currentUser = null;
let pc;

// LOGIN
async function login() {
  const id = document.getElementById("id").value;
  const pin = document.getElementById("pin").value;

  const res = await fetch(SERVER + "/login", {
    method: "POST",
    headers: {"Content-Type": "application/json"},
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

// CHAT
function send() {
  const msg = document.getElementById("msg").value;

  socket.emit("message", {
    user: currentUser,
    text: msg
  });

  document.getElementById("msg").value = "";
}

socket.on("message", (msg) => {
  const box = document.getElementById("messages");
  box.innerHTML += `<div><b>${msg.user}:</b> ${msg.text}</div>`;
});

// CALLS (WITH TURN)
async function startCall() {
  pc = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      {
        urls: [
          "turn:YOUR-IP:3478?transport=udp",
          "turn:YOUR-IP:3478?transport=tcp"
        ],
        username: "testuser",
        credential: "testpass"
      }
    ]
  });

  const stream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  document.getElementById("local").srcObject = stream;

  stream.getTracks().forEach(track => pc.addTrack(track, stream));

  pc.ontrack = (event) => {
    document.getElementById("remote").srcObject = event.streams[0];
  };

  pc.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("signal", { candidate: event.candidate });
    }
  };
}

socket.on("signal", async (data) => {
  if (!pc) return;

  if (data.candidate) {
    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

// UI SWITCH
function show(tab) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(tab).classList.remove("hidden");
}
