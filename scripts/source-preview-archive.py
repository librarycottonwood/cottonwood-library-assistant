"""Extract only bounded, ordinary preview files; never execute artifact contents."""
from pathlib import Path, PurePosixPath
import stat
import sys
import zipfile


def extract(archive, destination):
    root = Path(destination)
    root.mkdir(parents=True, exist_ok=False)
    with zipfile.ZipFile(archive) as bundle:
        entries = bundle.infolist()
        if len(entries) > 2100 or sum(item.file_size for item in entries) > 100 * 1024 * 1024:
            raise ValueError('Preview archive exceeds its size limit')
        seen = set()
        for item in entries:
            name = item.filename
            parts = name.rstrip('/').split('/')
            mode = item.external_attr >> 16
            if (name in seen or not name or any(part in ('', '.', '..') for part in parts)
                    or '\\' in name or ':' in name or any(ord(char) < 32 for char in name)
                    or PurePosixPath(name).is_absolute() or stat.S_ISLNK(mode)
                    or (stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR))
                    or item.file_size > 25 * 1024 * 1024 or item.flag_bits & 1):
                raise ValueError('Preview archive contains an unsafe entry')
            seen.add(name)
        for item in entries:
            target = root.joinpath(*item.filename.rstrip('/').split('/'))
            if item.is_dir():
                target.mkdir(parents=True, exist_ok=True)
            else:
                target.parent.mkdir(parents=True, exist_ok=True)
                with bundle.open(item) as source, target.open('xb') as output:
                    output.write(source.read(25 * 1024 * 1024 + 1))


if __name__ == '__main__':
    extract(sys.argv[1], sys.argv[2])
