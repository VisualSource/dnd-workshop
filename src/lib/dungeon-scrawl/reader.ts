import { readFile, BaseDirectory } from "@tauri-apps/plugin-fs";

export const readDSFile = async (file: string) => {
	const dsFile = await readFile(file, {
		baseDir: BaseDirectory.AppData,
	});

	const magic = dsFile.slice(0, 4);

	if (
		!(
			magic[0] === 0x50 &&
			magic[1] === 0x4b &&
			magic[2] === 0x03 &&
			magic[3] === 0x04
		)
	) {
		throw new Error("File is not a zip file");
	}

	// https://en.wikipedia.org/wiki/ZIP_(file_format)

	const version = dsFile.slice(4, 4 + 2);
	const generalbitFlag = dsFile.slice(6, 6 + 2);
	const compressionMethod = dsFile.slice(8, 8 + 2);

	const lastModTime = dsFile.slice(10, 10 + 2);
	const lastModDate = dsFile.slice(12, 12 + 2);

	const crc32UncompresedData = dsFile.slice(14, 14 + 4);

	const compressedSize = dsFile.slice(18, 18 + 4);
	const uncompressedSize = dsFile.slice(22, 22 + 4);
	const fileNameLen = dsFile.slice(26, 26 + 2);
	const extraFieldLength = dsFile.slice(28, 28 + 2);
	const fileName = dsFile.slice(30, 30 + fileNameLen);
	const extraField = dsFile.slice(30 + fileNameLen, extraFieldLength);
};
