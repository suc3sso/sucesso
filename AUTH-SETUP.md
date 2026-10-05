# SUCESSO — Activación del login por código

El frontend ya está conectado a Firebase Authentication/Firestore y espera dos Callable Functions: `requestEmailCode` y `verifyEmailCode` en `us-central1`.

## 1) Firebase Authentication
En Firebase Console > Authentication > Sign-in method:
- Mantener habilitado **Email/Password**.
- Habilitar **Email link (passwordless sign-in)**.
- En Authentication > Settings > Authorized domains, confirmar:
  - `www.sucessobrand.com`
  - `sucessobrand.com`

El código numérico visible al cliente es de SUCESSO; internamente, después de verificarlo en el servidor, se consume un enlace de acceso oficial de Firebase. Así la misma pantalla crea automáticamente un usuario nuevo o inicia sesión en uno existente.

## 2) Cuenta remitente
Para usar Gmail como remitente automático, activa verificación en dos pasos en la cuenta de SUCESSO y genera una **App Password**. No pongas esa contraseña dentro de HTML/JS ni la subas al repositorio.

## 3) Instalar y configurar funciones
Desde esta carpeta:

```bash
npm install -g firebase-tools
firebase login
cd functions
npm install
cd ..
```

Configura secretos:

```bash
firebase functions:secrets:set SMTP_USER
firebase functions:secrets:set SMTP_PASS
firebase functions:secrets:set OTP_PEPPER
```

Valores recomendados:
- `SMTP_USER`: correo remitente de SUCESSO (por ejemplo `help.sucsso@gmail.com`).
- `SMTP_PASS`: App Password de Gmail, no la contraseña normal.
- `OTP_PEPPER`: cadena aleatoria larga (idealmente 64 caracteres o más).

Parámetros no secretos (el deploy pedirá confirmarlos si hace falta):
- `SMTP_HOST`: `smtp.gmail.com`
- `SMTP_PORT`: `465`
- `SMTP_FROM`: por ejemplo `Sucesso <help.sucsso@gmail.com>`
- `AUTH_CONTINUE_URL`: `https://www.sucessobrand.com/login.html`
- `BRAND_LOGO_URL`: `https://www.sucessobrand.com/images/logo%20cherry%20png.png`

Deploy:

```bash
firebase deploy --only functions:requestEmailCode,functions:verifyEmailCode
```

## 4) Firestore
No necesitas dar acceso desde el navegador a `authEmailCodes` ni `authRateLimits`. Tus reglas actuales no contienen un `match` para esas colecciones, por lo que siguen denegadas al cliente. Las Functions usan Admin SDK y pueden operar allí sin abrirlas públicamente.

## 5) Flujo final
1. El cliente escribe el correo.
2. `requestEmailCode` genera un código criptográficamente aleatorio de 6 dígitos y un enlace passwordless de Firebase.
3. El servidor guarda solamente el hash del código, limita reenvíos/intentos y manda el código por correo.
4. El cliente introduce 6 dígitos.
5. `verifyEmailCode` verifica el hash y devuelve el enlace de Firebase una sola vez.
6. El navegador completa `signInWithEmailLink`, crea la cuenta si no existía o entra en la existente, mantiene el mismo UID cuando Firebase ya conoce ese email y redirige a `mi-cuenta.html` (o vuelve al checkout si venía de allí).

## Importante sobre costo
El frontend no usa Shopify ni Shopify Plus. Firebase Authentication soporta nativamente el acceso passwordless por enlace. El formato de **código numérico por email** requiere lógica segura en servidor; aquí está implementada con Firebase Functions + SMTP. Firebase exige el plan Blaze para desplegar Cloud Functions, aunque tenga cuotas de uso sin cargo. Si el requisito es literalmente no vincular facturación, habría que usar el flujo nativo por enlace en lugar del código numérico o alojar estas dos funciones en otro backend.
