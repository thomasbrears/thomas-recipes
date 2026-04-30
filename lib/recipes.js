import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";
import { withTimeout } from "./utils";

/* ─────────────────────────────────────────────
   FIRESTORE
──────────────────────────────────────────── */

const RECIPES_COLLECTION = "recipes";
const PAGE_SIZE = 12;

/**
 * Fetch one page of published recipes.
 * @param {import("firebase/firestore").QueryDocumentSnapshot | null} cursor
 *   Pass null for the first page; pass the last doc from the previous page
 *   to get the next one.
 * @returns {{ recipes: object[], nextCursor: object | null, hasMore: boolean }}
 */
export async function getRecipes(cursor = null) {
  let q = query(
    collection(db, RECIPES_COLLECTION),
    where("published", "==", true),
    orderBy("createdAt", "desc"),
    limit(PAGE_SIZE)
  );

  if (cursor) {
    q = query(
      collection(db, RECIPES_COLLECTION),
      where("published", "==", true),
      orderBy("createdAt", "desc"),
      startAfter(cursor),
      limit(PAGE_SIZE)
    );
  }

  const snapshot = await getDocs(q);
  const recipes = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  const nextCursor = snapshot.docs[snapshot.docs.length - 1] ?? null;
  const hasMore = snapshot.docs.length === PAGE_SIZE;

  return { recipes, nextCursor, hasMore };
}

export async function getRecipe(id) {
  const docRef = doc(db, RECIPES_COLLECTION, id);
  const snapshot = await withTimeout(getDoc(docRef), 10000);

  if (!snapshot.exists()) return null;

  return { id: snapshot.id, ...snapshot.data() };
}

export async function addRecipe(data) {
  const docRef = await addDoc(collection(db, RECIPES_COLLECTION), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
}

export async function updateRecipe(id, data) {
  const docRef = doc(db, RECIPES_COLLECTION, id);

  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteRecipe(id) {
  const docRef = doc(db, RECIPES_COLLECTION, id);
  await deleteDoc(docRef);
}

/* ─────────────────────────────────────────────
   CLOUDFLARE R2 UPLOAD
──────────────────────────────────────────── */

export async function uploadImage(file) {
  const res = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileName: file.name, contentType: file.type }),
  });

  if (!res.ok) throw new Error("Failed to get upload URL");

  const { url, key } = await res.json();

  const uploadRes = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  if (!uploadRes.ok) throw new Error("Failed to upload image to R2");

  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${key}`;
}

export async function uploadImages(files) {
  const results = [];
  for (const file of files) {
    results.push(await uploadImage(file));
  }
  return results;
}