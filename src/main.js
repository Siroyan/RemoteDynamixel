'use strict';

import { connection } from '@open-ayame/ayame-web-sdk';
import { defaultOptions } from '@open-ayame/ayame-web-sdk';

import {torqueOn, drive, stop} from './dynamixel-packet';

let roomId = '';
let clientId = null;
let videoCodec = null;
let signalingKey = '';

function onChangeVideoCodec() {
	videoCodec = document.getElementById("video-codec").value;
	if (videoCodec == 'none') {
		videoCodec = null;
	}
}

// query string から roomId, clientId を取得するヘルパー
function parseQueryString() {
	const qs = window.Qs;
	if (window.location.search.length > 0) {
		var params = qs.parse(window.location.search.substr(1));
		if (params.roomId) {
			roomId = params.roomId;
		}
		if (params.clientId) {
			clientId = params.clientId;
		}
		if (params.signalingKey) {
			signalingKey = params.signalingKey;
		}
	}
}

parseQueryString();

window.onload = function() {
	const roomIdInput = document.getElementById("roomIdInput");
	roomIdInput.addEventListener('change', (event) => {
		console.log(event);
		roomId = event.target.value;
	});
};

const options = defaultOptions;
options.clientId = clientId ? clientId : options.clientId;
if (signalingKey) {
	options.signalingKey = signalingKey;
}
options.video.direction = 'recvonly';
options.audio.direction = 'recvonly';
const remoteVideo = document.querySelector('#remote-video');
let conn;
const disconnect = () => {
	if (conn) {
		conn.disconnect();
	}
}
let dataChannel = null;
const label = 'dataChannel';
const startConn = async () => {
	options.video.codec = videoCodec;
	conn = connection('wss://ayame-labo.shiguredo.jp/signaling', roomId, options, true);
	conn.on('open', async (e) => {
		dataChannel = await conn.createDataChannel(label);
		dataChannel.binaryType = "arraybuffer";
		if (dataChannel) {
			dataChannel.onmessage = onMessage;
		}
	});
	conn.on('datachannel', (channel) => {
		if (!dataChannel) {
			dataChannel = channel;
			dataChannel.onmessage = onMessage;
		}
	});
	await conn.connect(null);
	conn.on('addstream', (e) => {
		remoteVideo.srcObject = e.stream;
	});
	conn.on('disconnect', (e) => {
		console.log(e);
		dataChannel = null;
		remoteVideo.srcObject = null;
	});
};

const sendData = () => {
	if (dataChannel && dataChannel.readyState === 'open') {
		dataChannel.send(array);
	}
}

document.querySelector("#roomIdInput").value = roomId;
document.querySelector("#clientIdInput").value = options.clientId;

function onMessage(e) {
	const messages = document.querySelector("#messages").value;
	newMessages = messages ? (messages + '\n' + e.data) : e.data;
	document.querySelector("#messages").value = newMessages;
}

let inputKeyBuffer = new Array();

document.onkeydown = (e) => {
	inputKeyBuffer[e.key] = true;
};

document.onkeyup = (e) => {
	inputKeyBuffer[e.key] = false;
};

const command = function() {
	sendData(torqueOn(0x01));
	sendData(torqueOn(0x02));
	if (inputKeyBuffer['w']) {
		sendData(drive(0x01, 100));
		sendData(drive(0x02, -100));
	} else if (inputKeyBuffer['a']) {
		sendData(drive(0x01, 100));
		sendData(drive(0x02, 100));
	} else if (inputKeyBuffer['s']) {
		sendData(drive(0x01, -100));
		sendData(drive(0x02, 100));
	} else if (inputKeyBuffer['d']) {
		sendData(drive(0x01, -100));
		sendData(drive(0x02, -100));
	} else {
		sendData(drive(0x01, 0));
		sendData(drive(0x02, 0));
	}
}

setInterval(command, 50);

window.startConn = startConn;
window.disconnect = disconnect;
window.sendData = sendData;
window.onChangeVideoCodec = onChangeVideoCodec;