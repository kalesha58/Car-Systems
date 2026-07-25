import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove,
  increment,
  writeBatch,
  type DocumentData,
  type QueryConstraint,
  type SetOptions,
  type DocumentReference,
  type CollectionReference,
  type Query,
} from 'firebase/firestore';

import { getFirebaseApp } from '../firebase/init';

type SnapshotHandler = (snapshot: any) => void;
type ErrorHandler = (error: Error) => void;

function db() {
  return getFirestore(getFirebaseApp());
}

function wrapDocSnapshot(snap: any) {
  return {
    id: snap.id as string,
    exists: typeof snap.exists === 'function' ? snap.exists() : !!snap.exists,
    data: () => snap.data() as DocumentData | undefined,
    ref: wrapDocRef(snap.ref as DocumentReference),
  };
}

function wrapDocRef(ref: DocumentReference) {
  return {
    id: ref.id,
    path: ref.path,
    get: async () => wrapDocSnapshot(await getDoc(ref)),
    set: (data: DocumentData, options?: SetOptions) =>
      options ? setDoc(ref, data, options) : setDoc(ref, data),
    update: (data: DocumentData) => updateDoc(ref, data),
    delete: () => deleteDoc(ref),
    onSnapshot: (onNext: SnapshotHandler, onError?: ErrorHandler) =>
      onSnapshot(ref, s => onNext(wrapDocSnapshot(s)), onError),
    collection: (name: string) => wrapCollectionRef(collection(ref, name)),
  };
}

function wrapQuerySnapshot(snap: Awaited<ReturnType<typeof getDocs>>) {
  return {
    empty: snap.empty,
    size: snap.size,
    docs: snap.docs.map(d => wrapDocSnapshot(d)),
    forEach: (cb: (doc: ReturnType<typeof wrapDocSnapshot>) => void) => {
      snap.docs.forEach(d => cb(wrapDocSnapshot(d)));
    },
  };
}

function createQueryApi(colRef: CollectionReference, constraints: QueryConstraint[] = []) {
  const q = constraints.length ? query(colRef, ...constraints) : colRef;

  return {
    where(field: string, op: any, value: unknown) {
      return createQueryApi(colRef, [...constraints, where(field, op, value)]);
    },
    orderBy(field: string, direction?: 'asc' | 'desc') {
      return createQueryApi(colRef, [...constraints, orderBy(field, direction)]);
    },
    limit(n: number) {
      return createQueryApi(colRef, [...constraints, limit(n)]);
    },
    get: async () => wrapQuerySnapshot(await getDocs(q as Query)),
    onSnapshot: (onNext: SnapshotHandler, onError?: ErrorHandler) =>
      onSnapshot(q as Query, s => onNext(wrapQuerySnapshot(s)), onError),
    doc(id?: string) {
      return wrapDocRef(id ? doc(colRef, id) : doc(colRef));
    },
    add: async (data: DocumentData) => {
      const created = await addDoc(colRef, data);
      return { id: created.id };
    },
  };
}

function wrapCollectionRef(colRef: CollectionReference) {
  return createQueryApi(colRef);
}

function firestore() {
  return {
    collection: (name: string) => wrapCollectionRef(collection(db(), name)),
    doc: (path: string) => wrapDocRef(doc(db(), path)),
    batch: () => {
      const batch = writeBatch(db());
      return {
        set: (refLike: { path: string }, data: DocumentData, options?: SetOptions) => {
          const real = doc(db(), refLike.path);
          if (options) batch.set(real, data, options);
          else batch.set(real, data);
        },
        update: (refLike: { path: string }, data: DocumentData) => {
          batch.update(doc(db(), refLike.path), data);
        },
        delete: (refLike: { path: string }) => {
          batch.delete(doc(db(), refLike.path));
        },
        commit: () => batch.commit(),
      };
    },
  };
}

firestore.FieldValue = {
  serverTimestamp,
  delete: deleteField,
  arrayUnion,
  arrayRemove,
  increment,
};

export default firestore;
