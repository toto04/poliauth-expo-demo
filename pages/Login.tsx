import qs from 'qs'
import WebView from 'react-native-webview'
import { StackScreenProps } from '@react-navigation/stack'
import { FC, useContext } from 'react'
import React from 'react'

export interface LoginContextInterface {
    token?: string
    setToken: (token: string | undefined) => void
}

/**
 * questo context contiene il token e il metodo setToken per oterlo aggiornare quando avviene il login
 */
export let LoginContext = React.createContext<LoginContextInterface>({ setToken: () => { } })

/**
 * tipo dei parametri delle varie pagine (home e web, senza parametri)
 */
export type RootStackParamList = {
    home: undefined
    web: undefined
}

/**
 * questa funzione richiede il token a partire dal bizzarro codice magico ottenuto dal sito del poli
 * nella webview
 * @param code il codice restituito dalla pagina del sito del poli
 * @returns un oggetto contente informazioni riguardo al token oauth2
 */
export async function getAccessToken(code: string): Promise<{
    "error"?: string
    "access_token": string
    "expires_in": number
    "refresh_token": string
    "token_type": string
}> {
    let postData = {
        'grant_type': 'authorization_code',
        code,
        'client_id': '9978142015',
        'client_secret': '61760'
    }
    let result = await fetch('https://oauthidp.polimi.it/oauthidp/oauth2/token', {
        method: 'post',
        body: qs.stringify(postData),
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
    })
    return await result.json()
}

let vw: WebView | null = null
/**
 * questo componente è una pagina che mostra a schermo il sito di login del poli, e segue il redirect
 * alla pagina che ho copiato dal source code di PoliAuthenticator per ottenere il codice che serve
 * per avere il token oauth2
 */
export let WebPage: FC<StackScreenProps<RootStackParamList, 'web'>> = props => {
    let { setToken } = useContext(LoginContext)

    return <WebView
        ref={r => vw = r}   // assegna la ref per poter fare l'inject di javascript più avanti
        style={{
            borderWidth: 4,
            borderColor: 'red',
            flex: 1
        }}
        originWhitelist={['*']}
        source={{
            // viene caricato il magico url preso da poliauthenticator
            // NB: qua vengono definiti gli scope per il token oauth2, non ho idea di quali scope
            // siano possibili e vagamente quali servono a cosa (e.g adesso non mi fa accedere al
            // servizio 2161, ovvero la carriera didattica, non so quale scope vada aggiunto o se 
            // sia effettivamente possibile)
            uri: 'https://oauthidp.polimi.it/oauthidp/oauth2/auth?response_type=token&client_id=9978142015&client_secret=61760&redirect_uri=urn:ietf:wg:oauth:2.0:oob&scope=openid+865+aule+orario+rubrica+guasti+appelli+prenotazione+code+notifiche+esami+carriera+chat+webeep&access_type=offline',
            headers: {}
        }}
        onMessage={async e => {
            // listener per i messaggi che vengono emessi dal javascript injected, prende il code e
            // richiede il token oauth2 che viene settato nel context, poi ritorna alla home
            let tkns = await getAccessToken(e.nativeEvent.data)
            if (tkns.error) return
            // qui salvo solo l'access_token, ma ovviamente si può salvare anche il refresh_token
            // per gestire il refresh oauth2 quando scade l'access_token
            setToken(tkns.access_token)
            props.navigation.navigate('home')
        }}
        javaScriptEnabled={true}
        onNavigationStateChange={newNavState => {
            let { url } = newNavState
            if (!url) return
            // quando lo stato di navigazione cambia e viene raggiunto l'url qua sotto, viene
            // viene iniettato il javascript per mandare un messaggio contentente il codice oauth2
            // di nuovo spudaratamente copiato da poliauthenticator
            if (url.startsWith("https://oauthidp.polimi.it/oauthidp/oauth2/postLogin")) {
                // vw?.stopLoading()
                vw?.injectJavaScript("window.ReactNativeWebView.postMessage(document.querySelector('input').value)")
            }
        }}
    />
}