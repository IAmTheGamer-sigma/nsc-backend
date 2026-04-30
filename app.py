from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'

# Allow connections from your Electron app
socketio = SocketIO(app, cors_allowed_origins="*")

# -------------------------
# USER SYSTEM (simple)
# -------------------------
# MemberID : {pin, role}
users = {
    "011": {"pin": "1234", "role": "president"},
    "022": {"pin": "5678", "role": "member"}
}

# -------------------------
# BASIC ROUTE (fixes "Not Found")
# -------------------------
@app.route("/")
def home():
    return "NSC Backend is running!"

# -------------------------
# LOGIN ROUTE
# -------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    uid = data.get("id")
    pin = data.get("pin")

    if uid in users and users[uid]["pin"] == pin:
        return jsonify({
            "status": "ok",
            "role": users[uid]["role"]
        })
    else:
        return jsonify({
            "status": "fail"
        })

# -------------------------
# SOCKET.IO EVENTS
# -------------------------

# When user connects
@socketio.on("connect")
def handle_connect():
    print("User connected:", request.sid)

# When user joins
@socketio.on("join")
def handle_join(data):
    user_id = data.get("id")
    print(f"{user_id} joined")

# CHAT SYSTEM
@socketio.on("message")
def handle_message(msg):
    print("Message:", msg)
    emit("message", msg, broadcast=True)

# CALL SIGNALING (WebRTC)
@socketio.on("signal")
def handle_signal(data):
    emit("signal", data, broadcast=True, include_self=False)

# When user disconnects
@socketio.on("disconnect")
def handle_disconnect():
    print("User disconnected:", request.sid)

# -------------------------
# RUN SERVER (Render compatible)
# -------------------------
if __name__ == "__main__":
    print("Starting backend...")
    socketio.run(app, host="0.0.0.0", port=10000)
