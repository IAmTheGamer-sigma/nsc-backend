from flask import Flask, request
from flask_socketio import SocketIO, emit
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret'

socketio = SocketIO(app, cors_allowed_origins="*")

# SIMPLE USER DB (upgrade later to real DB)
users = {
    "01": "0116",
    "02": "1245",
    "03": "1234"
}

# ---------------- LOGIN ----------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    uid = data["id"]
    pin = data["pin"]

    if uid in users and users[uid] == pin:
        return {"status": "ok"}
    return {"status": "fail"}

# ---------------- CHAT ----------------
@socketio.on("message")
def handle_message(msg):
    emit("message", msg, broadcast=True)

# ---------------- CALL SIGNALING ----------------
@socketio.on("signal")
def signal(data):
    emit("signal", data, broadcast=True, include_self=False)

# ---------------- RUN ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port)
