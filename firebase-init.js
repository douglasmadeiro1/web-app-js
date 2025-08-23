
const firebaseConfig = {
    apiKey: "AIzaSyD4gwltyUBkWJi18-zw3TpHn4rQWSxK87Q",
    authDomain: "jsproject-f2bd8.firebaseapp.com",
    projectId: "jsproject-f2bd8",
    storageBucket: "jsproject-f2bd8.appspot.com",
    messagingSenderId: "972587241614",
    appId: "1:972587241614:web:737a292133c6a187d439df"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // ⚠️ cria db global
