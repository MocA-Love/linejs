// @ts-types="thrift-types"
import * as thrift from "thrift";
import { Buffer } from "node:buffer";
import {
	genHeader,
	type NestedArray,
	type ProtocolKey,
	type Protocols,
} from "./declares.ts";
import Int64 from "node-int64";
const Thrift = thrift.Thrift;

export function writeThrift(
	value: NestedArray,
	name: string,
	Protocol: (typeof Protocols)[ProtocolKey],
): Uint8Array {
	let myBuf: Buffer = Buffer.from([]);
	const buftra = new thrift.TBufferedTransport(
		myBuf,
		function (outBuf?: Buffer) {
			if (!outBuf) return;
			myBuf = Buffer.concat([myBuf, outBuf]);
		},
	);
	const myprot = new Protocol(buftra);
	_writeStruct(myprot, value);
	myprot.flush();
	buftra.flush();
	if (myBuf.length === 1 && myBuf[0] === 0) {
		myBuf = Buffer.from([]);
	}
	const writedBinary = new Uint8Array([
		...genHeader[Protocol == thrift.TBinaryProtocol ? 3 : 4](name),
		...myBuf,
		0,
	]);
	return writedBinary;
}
export function writeStruct(
	value: NestedArray,
	Protocol: (typeof Protocols)[ProtocolKey],
): Uint8Array {
	let myBuf: Buffer = Buffer.from([]);
	const buftra = new thrift.TBufferedTransport(
		myBuf,
		function (outBuf?: Buffer) {
			if (!outBuf) return;
			myBuf = Buffer.concat([myBuf, outBuf]);
		},
	);
	const myprot = new Protocol(buftra);
	_writeStruct(myprot, value);
	myprot.flush();
	buftra.flush();
	if (myBuf.length === 1 && myBuf[0] === 0) {
		myBuf = Buffer.from([]);
	}
	return myBuf;
}

function _writeStruct(
	output: thrift.TCompactProtocol | thrift.TCompactProtocol,
	value: NestedArray = [],
): void {
	if (!value.length) {
		return;
	}
	output.writeStructBegin("");

	value.forEach((e: NestedArray[0]) => {
		if (e === null || e === undefined) {
			return;
		}
		writeValue(output, e[0], e[1], e[2]);
	});

	output.writeFieldStop();
	output.writeStructEnd();
	return;
}

function writeValue(
	output: thrift.TCompactProtocol | thrift.TBinaryProtocol,
	ftype: number,
	fid: number,
	val:
		| undefined
		| null
		| NestedArray
		| string
		| boolean
		| number
		| bigint
		| Buffer
		| [number, Array<any>?]
		| [number, number, object?],
): void {
	if (val === undefined || val === null) {
		return;
	}
	switch (ftype) {
		case Thrift.Type.STRING:
			if (val instanceof Buffer) {
				output.writeFieldBegin("", Thrift.Type.STRING, fid);
				output.writeBinary(val);
				output.writeFieldEnd();
			} else {
				if (typeof val !== "string") {
					throw new TypeError(`ftype=${ftype}: value is not string`);
				}
				output.writeFieldBegin("", Thrift.Type.STRING, fid);
				output.writeString(val.toString());
				output.writeFieldEnd();
			}
			break;

		case Thrift.Type.DOUBLE:
			if (typeof val !== "number") {
				throw new TypeError(`ftype=${ftype}: value is not number`);
			}
			output.writeFieldBegin("", Thrift.Type.DOUBLE, fid);
			output.writeDouble(val);
			output.writeFieldEnd();
			break;

		case Thrift.Type.I64:
			if (typeof val === "bigint") {
				output.writeFieldBegin("", Thrift.Type.I64, fid);
				output.writeI64(new Int64(val.toString(16)));
				output.writeFieldEnd();
			} else if (typeof val !== "number") {
				throw new TypeError(`ftype=${ftype}: value is not number`);
			} else {
				output.writeFieldBegin("", Thrift.Type.I64, fid);
				output.writeI64(val);
				output.writeFieldEnd();
			}

			break;

		case Thrift.Type.I32:
			if (typeof val !== "number") {
				throw new TypeError(`ftype=${ftype}: value is not number`);
			}
			output.writeFieldBegin("", Thrift.Type.I32, fid);
			output.writeI32(val);
			output.writeFieldEnd();
			break;

		case Thrift.Type.BOOL:
			if (typeof val !== "boolean" && typeof val !== "number") {
				throw new TypeError(`ftype=${ftype}: value is not boolean`);
			}
			output.writeFieldBegin("", Thrift.Type.BOOL, fid);
			output.writeBool(Boolean(val));
			output.writeFieldEnd();
			break;

		case Thrift.Type.STRUCT:
			if (!Array.isArray(val)) {
				throw new TypeError(`ftype=${ftype}: value is not struct`);
			}
			if (!val.length) {
				return;
			}
			output.writeFieldBegin("", Thrift.Type.STRUCT, fid);
			_writeStruct(output, val as NestedArray);
			output.writeFieldEnd();
			break;

		case Thrift.Type.MAP:
			val = val as [number, number, object];
			if (!val[2]) {
				return;
			}
			output.writeFieldBegin("", Thrift.Type.MAP, fid);
			output.writeMapBegin(val[0], val[1], Thrift.objectLength(val[2]));
			for (const kiter in val[2]) {
				if (Object.prototype.hasOwnProperty.call(val[2], kiter)) {
					const viter = (val as any)[2][kiter];
					writeValue_(output, val[0], kiter);
					writeValue_(output, val[1], viter);
				}
			}
			output.writeMapEnd();
			output.writeFieldEnd();
			break;

		case Thrift.Type.LIST:
			val = val as [number, Array<any>];
			if (!val[1]) {
				return;
			}
			output.writeFieldBegin("", Thrift.Type.LIST, fid);
			output.writeListBegin(
				val[0],
				(val[1] as NonNullable<NestedArray>).length,
			);
			for (const iter in val[1] as any[]) {
				if (Object.prototype.hasOwnProperty.call(val[1], iter)) {
					writeValue_(output, val[0], val[1][iter]);
				}
			}
			output.writeListEnd();
			output.writeFieldEnd();
			break;
		case Thrift.Type.SET:
			val = val as [number, Array<any>];
			if (!val[1]) {
				return;
			}
			output.writeFieldBegin("", Thrift.Type.SET, fid);
			output.writeSetBegin(
				val[0],
				(val[1] as NonNullable<NestedArray>).length,
			);
			for (const iter in val[1] as NestedArray) {
				if (Object.prototype.hasOwnProperty.call(val[1], iter)) {
					writeValue_(output, val[0], val[1][iter]);
				}
			}
			output.writeSetEnd();
			output.writeFieldEnd();
			break;
		default:
			break;
	}
}

function writeValue_(
	output: thrift.TCompactProtocol | thrift.TCompactProtocol,
	ftype: number,
	val:
		| undefined
		| null
		| NestedArray
		| string
		| boolean
		| number
		| bigint
		| Buffer
		| [number, Array<any>]
		| [number, number, object],
): void {
	if (val === undefined || val === null) {
		return;
	}
	switch (ftype) {
		case Thrift.Type.STRING:
			if (val instanceof Buffer) {
				output.writeBinary(val);
			} else {
				if (typeof val !== "string") {
					throw new TypeError(`ftype=${ftype}: value is not string`);
				}
				output.writeString(val.toString());
			}
			break;

		case Thrift.Type.DOUBLE:
			if (typeof val !== "number") {
				throw new TypeError(`ftype=${ftype}: value is not number`);
			}
			output.writeDouble(val);
			break;

		case Thrift.Type.I64:
			if (typeof val !== "number") {
				throw new TypeError(`ftype=${ftype}: value is not number`);
			}
			output.writeI64(val);
			break;

		case Thrift.Type.I32:
			if (typeof val !== "number") {
				throw new TypeError(`ftype=${ftype}: value is not number`);
			}
			output.writeI32(val);
			break;

		case Thrift.Type.BOOL:
			if (typeof val !== "boolean") {
				throw new TypeError(`ftype=${ftype}: value is not boolean`);
			}
			output.writeBool(val);
			break;

		case Thrift.Type.STRUCT:
			if (!Array.isArray(val)) {
				throw new TypeError(`ftype=${ftype}: value is not struct`);
			}
			_writeStruct(output, val as NestedArray);
			break;

		default:
			break;
	}
}
