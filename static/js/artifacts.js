// Client for the artifact catalog API.
// The single source of truth is the database, seeded from data/artifacts.json
// with `python manage.py seed_catalog`. Translations (ru, kk) come with each record.

const LOCALIZED_FIELDS = ['name', 'status', 'brief_description', 'first_person_story', 'key_facts', 'fleet_members'];
const detailCache = new Map();

export async function loadArtifacts() {
  const response = await fetch('/api/artifacts/');
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  const { artifacts } = await response.json();
  return Array.isArray(artifacts) ? artifacts : [];
}

// Full record with story, facts and sources. Cached, so prefetching on selection makes "Learn more" instant.
export function loadArtifactDetail(code) {
  if (!detailCache.has(code)) {
    const request = fetch(`/api/artifacts/${encodeURIComponent(code)}/`)
      .then((response) => {
        if (!response.ok) throw new Error(`Artifact request failed: ${response.status}`);
        return response.json();
      })
      .catch((err) => {
        detailCache.delete(code);   // allow a retry next time
        throw err;
      });
    detailCache.set(code, request);
  }
  return detailCache.get(code);
}

// Returns a copy of the artifact with text fields in the requested language (English fallback).
export function localizeArtifact(artifact, lang) {
  const translation = artifact?.translations?.[lang];
  if (!translation) return artifact;
  const localized = { ...artifact };
  for (const field of LOCALIZED_FIELDS) {
    if (translation[field]) localized[field] = translation[field];
  }
  return localized;
}

export const hasSurfacePosition = (artifact) => artifact.latitude != null && artifact.longitude != null;
