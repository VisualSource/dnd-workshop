const utf8decoder = new TextDecoder();

const asString = (buffer: Uint8Array<ArrayBuffer>): string => {
    return utf8decoder.decode(buffer);;
};
const crc32Check = (value: number, content: Uint8Array<ArrayBuffer>) => {}

const eocd = (buffer: Uint8Array<ArrayBuffer>) => {
	if(!(buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x05 && buffer[3] === 0x06)) throw new Error("invalid magic");

	const view = new DataView(buffer.buffer);

	const numberOfDisk = view.getUint16(4,true);
	const diskCentalStarts = view.getUint16(6,true);
	const numberOfCentralDirRecords = view.getUint16(8,true);
	const totalNumberOfCentralRecords = view.getUint16(10,true);

	const sizeOfCentralDirBytes = view.getUint32(12,true);
	const offsetOfStartCtrlDirRelStart = view.getUint32(16,true);

	const commentLen = view.getUint16(20,true);
	const comment = buffer.slice(22,22+commentLen);

	return {
		comment: asString(comment),
		numberOfDisk,
		diskCentalStarts,
		numberOfCentralDirRecords,
		totalNumberOfCentralRecords,
		sizeOfCentralDirBytes,
		offsetOfStartCtrlDirRelStart
	}
}

const centralDirFileHeader = (file: Uint8Array<ArrayBuffer>) => {
	if(!(file[0] === 0x50 && file[1] === 0x4B && file[2] === 0x01 && file[3] === 0x02)) throw new Error("invalid magic");
	const view = new DataView(file.buffer);

	const version = view.getUint16(4,true);
	const extractVersion = view.getUint16(6,true);
	const generalPurposeBitFlag = view.getUint16(8,true);
	const compressionMethod = view.getUint16(10,true);
	const lastModTime = view.getUint16(12,true);
	const lastModDate = view.getUint16(14,true);
	const crc32 = view.getUint32(16,true);
	const compressedSize = view.getUint32(20,true);
	const uncompressedSize = view.getUint32(24,true);

	const fileNameLen = view.getUint16(28,true);
	const extraFieldLen = view.getUint16(30,true);
	const commentLen = view.getUint16(32,true);
	const diskNumberFileStarts = view.getUint16(34,true);
	const internalFileAttrs = view.getUint16(36,true);
	const externalFileAttr = view.getUint32(38,true);
	const relativeOffsetLocalHeader = view.getUint32(42,true);

	const fileName = file.slice(46,46+fileNameLen);
	const extraField = file.slice(46+fileNameLen,46+fileNameLen+extraFieldLen);
	const comment = file.slice(46+fileNameLen+extraFieldLen,46+fileNameLen+extraFieldLen+commentLen);

	return {
		version,
		extractVersion,
		generalPurposeBitFlag,
		compressionMethod,
		lastModTime,
		lastModDate,
		crc32,
		compressedSize,
		uncompressedSize,
		diskNumberFileStarts,
		internalFileAttrs,
		externalFileAttr ,
		relativeOffsetLocalHeader,
		comment: asString(comment),
		fileName: asString(fileName),
		extraField,

		readBytes:46+fileNameLen+extraFieldLen+commentLen
	}
}

const localFileHeader = (file: Uint8Array<ArrayBuffer>) => {
	const header = file.slice(0, 4);
	if (
		!(
			header[0] === 0x50 &&
			header[1] === 0x4b &&
			header[2] === 0x03 &&
			header[3] === 0x04
		)
	) {
		throw new Error("Invalid file header");
	}

	const view = new DataView(file.buffer);

	const extractionVersion = view.getUint16(4, true);
	const generalPurposeBitFlag = view.getUint16(6, true);
	const compressionMethod = view.getUint16(8, true);

	const lastModTime = view.getUint16(10, true);
	const lastModDate = view.getUint16(12, true);
	const crc32 = view.getUint32(14, true);
	const compressedSize = view.getUint32(18, true);
	const uncompressedSize = view.getUint32(22, true);

	const fileNameLen = view.getUint16(26, true);
	const extraFieldLen = view.getUint16(28, true);

	const fileName = file.slice(30, 30 + fileNameLen);
	const extraField = file.slice(
		30 + fileNameLen,
		30 + fileNameLen + extraFieldLen,
	);

	const endOfHeaderOffset = 30 + fileNameLen + extraFieldLen;
	const endOfContentOffset = endOfHeaderOffset + (compressionMethod === 8 ? compressedSize : uncompressedSize);
	const content = file.slice(endOfHeaderOffset, endOfContentOffset);

	crc32Check(crc32,content);

	return {
		extractionVersion,
		generalPurposeBitFlag,
		compressionMethod:
			compressionMethod === 8
				? "DEFLATE"
				: compressionMethod === 0
					? "none"
					: "unknown",
		lastModDate,
		lastModTime,
		crc32,
		uncompressedSize,
		compressedSize,
		fileNameLen,
		extraFieldLen,
		fileName: asString(fileName),
		extraField,
		content: content,

		readBytes: endOfContentOffset
	};
}
// https://en.wikipedia.org/wiki/ZIP_(file_format)
export const readZip = (file: Uint8Array<ArrayBuffer>) => {
	let eocdByteOffset = file.byteLength;
	do {
		
		if((eocdByteOffset + 4) > file.byteLength) {
			eocdByteOffset -= 1;
			continue;
		}
		const bytes = file.slice(eocdByteOffset,eocdByteOffset+4);
		if(bytes[0] === 0x50 && bytes[1] === 0x4B && bytes[2] === 0x05 && bytes[3] === 0x06) {
			break;
		} 

		eocdByteOffset -= 1;
	} while(eocdByteOffset > 0);

	if(eocdByteOffset <= 0) throw new Error("Failed to find EOCD header");

	const eocdHeader = eocd(file.slice(eocdByteOffset));
	console.log(eocdHeader);

	const centralDirHeaderBytes = file.slice(eocdHeader.offsetOfStartCtrlDirRelStart,eocdHeader.offsetOfStartCtrlDirRelStart+eocdHeader.sizeOfCentralDirBytes);

    const files: Record<string, ReturnType<typeof localFileHeader>>  = {};

	let headerBytesRead = 0;
	while(headerBytesRead < centralDirHeaderBytes.byteLength){
		const header = centralDirFileHeader(centralDirHeaderBytes.slice(headerBytesRead));
		headerBytesRead += header.readBytes;

		const lf = localFileHeader(file.slice(header.relativeOffsetLocalHeader));
        files[header.fileName] = lf;
	}

    return files;
};