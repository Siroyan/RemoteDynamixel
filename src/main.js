'use strict';

import { connection } from '@open-ayame/ayame-web-sdk';
import { defaultOptions } from '@open-ayame/ayame-web-sdk';

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

function sendData(array) {
	const data = document.querySelector("#sendDataInput").value;
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

let prevSendTime = 0;
document.onkeydown = (e) => {
	if (new Date().getTime() - prevSendTime > 100) {
		prevSendTime = new Date().getTime();
		if (e.key === 'w') {
			console.log('w');
			let array = new Uint8Array(13);
			array[0]  = 0xFF;
			array[1]  = 0xFF;
			array[2]  = 0xFD;
			array[3]  = 0x00;
			array[4]  = 0x01;
			array[5]  = 0x06;
			array[6]  = 0x00;
			array[7]  = 0x03;
			array[8]  = 0x41;
			array[9]  = 0x00;
			array[10] = 0x01;
			array[11] = 0xCC;
			array[12] = 0xE6;
			sendData(array);
		} else if (e.key === 'a') {
			console.log('a');
			
		} else if (e.key === 's') {
			console.log('s');
			
		} else if (e.key === 'd') {
			console.log('d');
		}
	}
}

window.startConn = startConn;
window.disconnect = disconnect;
window.sendData = sendData;
window.onChangeVideoCodec = onChangeVideoCodec;