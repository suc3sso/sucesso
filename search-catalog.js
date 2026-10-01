/* Lazy shared Firestore catalog provider used only when search is actually used. */
(() => {
'use strict';
const firebaseConfig = {
  apiKey: 'AIzaSyD3u2GKMSAKC_1Cd88KA-rxTOf_Jnt3fuM',
  authDomain: 'sucesso-74f7c.firebaseapp.com',
  projectId: 'sucesso-74f7c',
  storageBucket: 'sucesso-74f7c.appspot.com',
  messagingSenderId: '878844661636',
  appId: '1:878844661636:web:6382f86f18201aecfdd7d1'
};
let request;
window.sucessoCatalogLoader = () => {
  if (request) return request;
  request = (async () => {
    const [appSdk, storeSdk] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js')
    ]);
    // Let the page's own Firebase module initialize its original app first.
    for (let i = 0; i < 20 && !appSdk.getApps().length; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    const app = appSdk.getApps().length ? appSdk.getApp() : appSdk.initializeApp(firebaseConfig);
    const db = storeSdk.getFirestore(app);
    const snapshot = await storeSdk.getDocs(storeSdk.collection(db, 'productos'));
    return snapshot.docs.map(snap => {
      const data = snap.data();
      return { ...data, nombre: data.nombre || snap.id };
    });
  })().catch(error => {
    request = null;
    throw error;
  });
  return request;
};
window.dispatchEvent(new Event('sucesso:catalog-ready'));
})();
