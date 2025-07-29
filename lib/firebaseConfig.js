import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCEkXM3KWZgbfHk832koIjSqmocWHhy8AM",
  authDomain: "agendaarena-3f0f2.firebaseapp.com",
  projectId: "agendaarena-3f0f2",
  storageBucket: "agendaarena-3f0f2.appspot.com", // corrigido ".app" para ".appspot.com"
  messagingSenderId: "443153229747",
  appId: "1:443153229747:web:098243a223c24a689dcdc6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

