"""Versioned URLs for our own JS and CSS.

Every page gets `asset_version` (a short fingerprint of the files) and `importmap_json`.
Stylesheets and the entry script are linked with `?v=<version>`, and the import map points
every module in static/js to its versioned URL, so modules that import each other with
relative paths are versioned too. When any file changes, the version changes and browsers
cannot keep running an old copy.
"""

import hashlib
import json
from functools import lru_cache
from pathlib import Path

from django.conf import settings
from django.templatetags.static import static

BASE = Path(settings.BASE_DIR)
JS_DIR = BASE / "static" / "js"
WATCHED = [JS_DIR, BASE / "static" / "css", BASE / "ai_assistant" / "static" / "ai_assistant"]


def _fingerprint():
    digest = hashlib.md5()
    for root in WATCHED:
        for path in sorted(root.rglob("*")):
            if path.is_file():
                stat = path.stat()
                digest.update(f"{path.relative_to(BASE)}:{stat.st_mtime_ns}:{stat.st_size}".encode())
    return digest.hexdigest()[:10]


@lru_cache(maxsize=1)
def _fingerprint_once():
    return _fingerprint()


def _importmap(version):
    imports = {
        "three": static("vendor/three/three.module.min.js"),
        "three/addons/": static("vendor/three/addons/"),
    }
    for module in sorted(JS_DIR.glob("*.js")):
        url = static(f"js/{module.name}")
        imports[url] = f"{url}?v={version}"
    return json.dumps({"imports": imports}, indent=2)


def assets(request):
    # In development files change all the time, so recompute (a stat of ~30 files);
    # in production the files are fixed until the next deploy.
    version = _fingerprint() if settings.DEBUG else _fingerprint_once()
    return {"asset_version": version, "importmap_json": _importmap(version)}
