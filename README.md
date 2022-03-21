# PoliAuth Expo Demo
questa è una demo di implementazione dell'autenticazione / scraping del sito del poli in un'app
basata su [React Native](https://reactnative.dev) e [Expo](https://expo.dev)

È un esempio di come si potrebbe strutturare un'ipotetica implementazione dei servizi online del poli
nell'app, per includere in-app cose come l'accesso a webeep, media dei voti, calendario delle lezioni,
iscrizione e date degli esami

## Struttura
- in [App.tsx](App.tsx) viene gestita la navigazione tra la pagina di default e la pagina di login, e
viene gestita la lettura / scrittura sullo storage del dispositivo del token OAuth2 per la persistenza
del login.
- in [api.ts](api.ts) sono dichiarate alcune funzioni che servono per le chiamate e lo scraping del
sito del poli
- in [pages/Home.tsx](pages/Home.tsx) c'è un po' di roba inutile per la visualizzazione dell'orario
per la demo e il tasto di login / logout
- in [pages/Login.tsx](pages/Login.tsx) viene dichiarato il componente con la webview per il login
e viene gestito la richiesta del token OAuth2
- tutto il resto è boilerplating di react native

## Come eseguire l'applicazione
il processo di sviluppo nativo è quello fornito da expo, puoi leggere tutti i dettagli nella
[documentazione di Expo](https://docs.expo.dev)

Per un quick start segui queste istruzioni
### Prerequisiti
- [NodeJS](http://nodejs.org/)
- [Yarn](https://yarnpkg.com) (che con Node 16.10+ si può attivare con il comando ```corepack enable```)
- La CLI Expo che si può installare con il comando 
    ```sh
    npm install --global expo-cli
    ```
- L'applicazione Expo GO installata sul proprio telefono (https://expo.dev/client)

### Esecuzione
L'app può essere eseguita sul dispositivo con il comando
```sh
yarn start
```
e inquadrando il codice QR che viene sputato nella linea di comando, e il bundle javascript verrà
scaricato nell'app Expo Go, che supporta hot-reload e da cui si può aprire un element inspector e
avviare debugger scuotendo con molta rabbia e violenza il telefono