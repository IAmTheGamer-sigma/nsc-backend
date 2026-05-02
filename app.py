# ✅ VERY IMPORTANT (FIXES YOUR ERROR)
import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, send_from_directory
from flask_socketio import SocketIO, emit

# -------------------------
# APP SETUP
# -------------------------
app = Flask(__name__, static_folder="static")
app.config['SECRET_KEY'] = 'secret'

socketio = SocketIO(app, cors_allowed_origins="*")

# -------------------------
# USER SYSTEM
# -------------------------
users = {
    "01": {"pin": "0116", "role": "member"},
    "02": {"pin": "1245", "role": "member"},
    "03": {"pin": "1234", "role": "president"}
}

# -------------------------
# SERVE WEBSITE
# -------------------------
@app.route("/")
def serve():
    return send_from_directory(app.static_folder, "index.html")

# -------------------------
# LOGIN
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
    return jsonify({"status": "fail"})

# -------------------------
# SOCKET EVENTS
# -------------------------

@socketio.on("connect")
def on_connect():
    print("User connected")

@socketio.on("join")
def on_join(data):
    print(f"{data['id']} joined")

@socketio.on("message")
def on_message(msg):
    emit("message", msg, broadcast=True)

# 🔥 WebRTC signaling
@socketio.on("signal")
def on_signal(data):
    emit("signal", data, broadcast=True, include_self=False)

@socketio.on("disconnect")
def on_disconnect():
    print("User disconnected")

# -------------------------
# RUN SERVER
# -------------------------
if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=10000)
