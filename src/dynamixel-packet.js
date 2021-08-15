'use strict';

import { CRC } from 'crc-full';

function calculateCrc(packet) {
    let crc = CRC.default("CRC16_BUYPASS");
    let computedCrc = crc.compute(packet);
    return [computedCrc & 0xFF, computedCrc >> 8];
}

function makePacket(id, inst, params) {
    const header = [0xFF, 0xFF, 0xFD];
    const reserved = [0x00];
    const packetLength = [1 + params.length + 2];       // INST + PARAMS + CRC
    const packetLengthLowBit  = [packetLength & 0xFF];
    const packetLengthHighBit = [packetLength >> 8];
    let packet = [];
    packet = packet.concat(header);
    packet = packet.concat(reserved);
    packet = packet.concat(id);
    packet = packet.concat(packetLengthLowBit);
    packet = packet.concat(packetLengthHighBit);
    packet = packet.concat(inst);
    packet = packet.concat(params);
    packet = packet.concat(calculateCrc(packet));
    return Uint8Array.from(packet);
}

function torqueOn(id) {
    return makePacket(id, 0x03, [0x40, 0x00, 0x01]);
}

function drive(id, velovity) {
    let bit1 = velovity >>  0 & 0xFF;
    let bit2 = velovity >>  8 & 0xFF;
    let bit3 = velovity >> 16 & 0xFF;
    let bit4 = velovity >> 24 & 0xFF;
    return makePacket(id, 0x03, [0x68, 0x00, bit1, bit2, bit3, bit4]);
}

export { torqueOn, drive };