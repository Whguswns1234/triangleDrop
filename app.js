const socket = io();

const welcome = document.getElementById("welcome");
const inRoom = document.getElementById("inRoom");

let roomName;
let myPeerConnection;
let myDataChannel;

inRoom.hidden = true;

async function initRoom() {
  welcome.hidden = true;
  inRoom.hidden = false;
  makeConnection();
}

async function handleWelcomeSubmit(evnet) {
  event.preventDefault();
  const input = document.querySelector("input");
  await initRoom();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm = welcome.querySelector("form");
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

//RTC code

socket.on("welcome", async () => {
  myDataChannel = myPeerConnection.createDataChannel("DataChannel");
  myDataChannel.addEventListener("message", handleReceiveMessage);

  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);
  socket.emit("offer", offer, roomName);
  console.log("made data channel / send offer");
});

socket.on("offer", async (offer) => {
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", handleReceiveMessage);
  });

  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  myPeerConnection.setLocalDescription(answer);
  socket.emit("answer", answer, roomName);
  console.log("received the offer / send answer");
});

socket.on("answer", (answer) => {
  console.log("received the answer");
  myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
  console.log("received ice candidate");
});

function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  });

  myPeerConnection.addEventListener("icecandidate", handleIceCandidate);
}

function handleIceCandidate(data) {
  console.log("sent candidate");
  socket.emit("ice", data.candidate, roomName);
}

// send message with datachannel

messageForm = document.querySelector("#messageForm");
messageForm.addEventListener("submit", handleSendMessage);
const messageBlock = document.getElementById("message");

function handleSendMessage(event) {
  event.preventDefault();
  const message = document.getElementById("messageInput");
  myDataChannel.send(message.value);
  messageBlock.innerHTML += `<li>${message.value}</li>`;
  message.value = "";
}

function handleReceiveMessage(event) {
  messageBlock.innerHTML += `<li>${event.data}</li>`;
}
