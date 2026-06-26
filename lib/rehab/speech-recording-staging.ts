export type StagedSpeechRecordingStatus = "pending-trim" | "upload-failed";

export type StagedSpeechRecording = {
  eventId: string;
  blob: Blob;
  durationSeconds: number;
  mimeType: string;
  fileName: string;
  stagedAt: string;
  status: StagedSpeechRecordingStatus;
  uploadError?: string | null;
};

const DB_NAME = "karriqi-speech-staging";
const DB_VERSION = 1;
const STORE = "pending-uploads";

function openSpeechStagingDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is not available."));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "eventId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed."));
  });
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed."));
  });
}

export async function stageSpeechRecordingForUpload(
  recording: StagedSpeechRecording,
): Promise<void> {
  const db = await openSpeechStagingDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(recording);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed."));
      tx.onabort = () => reject(tx.error ?? new Error("IndexedDB write aborted."));
    });
  } finally {
    db.close();
  }
}

export async function loadStagedSpeechRecording(
  eventId: string,
): Promise<StagedSpeechRecording | null> {
  const db = await openSpeechStagingDb();
  try {
    const tx = db.transaction(STORE, "readonly");
    const record = await requestToPromise<StagedSpeechRecording | undefined>(
      tx.objectStore(STORE).get(eventId),
    );
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB read failed."));
    });
    return record ?? null;
  } finally {
    db.close();
  }
}

export async function clearStagedSpeechRecording(eventId: string): Promise<void> {
  const db = await openSpeechStagingDb();
  try {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(eventId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed."));
    });
  } finally {
    db.close();
  }
}
