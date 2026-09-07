import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from
  "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";

import { auth } from "./firebase.js";


export async function login(email, password) {

  return signInWithEmailAndPassword(
    auth,
    email,
    password
  );

}


export async function logout() {

  return signOut(auth);

}


export function observeAuth(callback) {

  return onAuthStateChanged(
    auth,
    callback
  );

}