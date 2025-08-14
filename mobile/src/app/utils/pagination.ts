import { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

export type Page<T> = { items: T[]; lastDoc: FirebaseFirestoreTypes.DocumentSnapshot | null };

export function applyPaging<T>(query: FirebaseFirestoreTypes.Query, pageSize: number, lastDoc?: FirebaseFirestoreTypes.DocumentSnapshot | null) {
  let q = query.limit(pageSize);
  if (lastDoc) q = q.startAfter(lastDoc);
  return q;
}