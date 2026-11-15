import { crc32, deflateRawSync } from 'node:zlib';

/** Date and time in the 16-bit formats of the ZIP file format. */
function dosDateTime(date: Date): { time: number; day: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    day: ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

/**
 * Builds a ZIP archive from text files, with nothing but Node.js: a few guides do not deserve a
 * dependency. `files` maps paths inside the archive (with `/`) to their content.
 */
export function zip(files: Record<string, string>, date = new Date()): Buffer {
  const { time, day } = dosDateTime(date);
  const parts: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;

  for (const [path, content] of Object.entries(files)) {
    const name = Buffer.from(path, 'utf8');
    const raw = Buffer.from(content, 'utf8');
    const data = deflateRawSync(raw, { level: 9 });

    // Shared by the local header and the central directory: version, flags (UTF-8 names),
    // deflate, time, date, checksum, sizes, name length, no extra field.
    const common = Buffer.alloc(26);
    common.writeUInt16LE(20, 0);
    common.writeUInt16LE(0x0800, 2);
    common.writeUInt16LE(8, 4);
    common.writeUInt16LE(time, 6);
    common.writeUInt16LE(day, 8);
    common.writeUInt32LE(crc32(raw), 10);
    common.writeUInt32LE(data.length, 14);
    common.writeUInt32LE(raw.length, 18);
    common.writeUInt16LE(name.length, 22);
    common.writeUInt16LE(0, 24);

    const local = Buffer.alloc(4);
    local.writeUInt32LE(0x04034b50, 0);
    parts.push(local, common, name, data);

    const central = Buffer.alloc(20);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // Version made by.
    const tail = Buffer.alloc(14); // Comment length, disk, attributes, then the offset of the local header.
    tail.writeUInt32LE(offset, 10);
    directory.push(central.subarray(0, 6), common, tail, name);

    offset += local.length + common.length + name.length + data.length;
  }

  const directorySize = directory.reduce((size, part) => size + part.length, 0);
  const count = Object.keys(files).length;
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(count, 8);
  end.writeUInt16LE(count, 10);
  end.writeUInt32LE(directorySize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, ...directory, end]);
}
