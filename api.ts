/**
 * in questo file sono contenuti i metodi relativi alle chiamate / scraping del sito del poli
 * virtualmente questa cosa potrebbe essere piantata in qualche sorta di classe con un life cycle
 * che permetta il refresh del token in caso sia scaduto, autoretry delle richieste in caso di
 * connessione assente ecc. (un po' tipo https://github.com/toto04/webeep-sync/tree/main/src/modules/moodle.ts)
 */

import { parse } from "fast-html-parser";
import qs from "qs";
import { Buffer } from "buffer";

const baseURL = 'https://aunicalogin.polimi.it/aunicalogin/'

/**
 * utility function per convertire un blob in un buffer, cose stra che vanno fatte perché l'encoding
 * del testo del sito del poli deve essere diverso da utf-8 per ragioni che sanno loro i guess
 */
function blobToBuffer(blob: Blob): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => {
            let res = reader.result as string
            const data = res.slice(res.indexOf('base64,') + 7);
            resolve(Buffer.from(data, 'base64'));
        };
        reader.readAsDataURL(blob);
    });
}

/**
 * converte il numero di caselle nelle tabelle degli orari del poli in orario leggibile
 * @param segments il numero di caselle nelle tabelle del sito del poli
 * @returns la string formattata in orario leggibile
 */
function segmentToTimeString(segments: number): string {
    let str = `${Math.floor(segments / 4) + 8}`.padStart(2, '0')
    str += ':'
    str += `${Math.floor(segments % 4) * 15}`.padStart(2, '0')
    return str
}

/**
 * chiamata base per caricare una pagina del sito del poli avendo un token oauth2 e il numero di servizio
 * @param token il token oauth2 per la chiamata
 * @param service il servizio che si vuole ottenere (e.g 398 per gli orari delle lezioni)
 * @param requestBody eventuali parametri da passare nel body POST come form-urlencoded
 * @returns la pagina html raw restituita dalla chiamata
 */
export async function call(token: string, service: number, requestBody?: any) {
    console.log('Calling service ' + service + ' with body: ', qs.stringify(requestBody))
    // questa è la prima chiamata che viene fatta per ottenere il servizio
    // restituisce una pagina di "controllo delle credenziali" whatever that means, quindi bisogna
    // fare una seconda chiamata facendo uno scraping della prima pagina restituita
    let url = `${baseURL}getservizioOAuth.xml?id_servizio=${service}&lang=it&access_token=${token}`
    let res = await fetch(url, {
        method: 'post',
        body: requestBody ? qs.stringify(requestBody) : undefined,
        headers: {
            'Content-type': 'application/x-www-form-urlencoded'
        }
    })

    // ottengo l'url di redirect e i valori da mandare in post dal form nella pagina restituita
    let form = parse(await res.text())
    let formRedirect = baseURL + form.querySelector('form')?.attributes['action'] ?? ''

    let body: { [key: string]: any } = {}
    form.querySelectorAll('input').forEach(i => {
        body[i.attributes['name']] = i.attributes['value'].replace('""', '')
    })

    // console.log(formRedirect)
    // console.log(qs.stringify(body))

    // la seconda pagina chiamata restituisce l'effettiva pagina del servizio richiesto
    let response = await fetch(formRedirect, {
        method: 'post',
        body: qs.stringify(body),
        headers: {
            'Content-type': 'application/x-www-form-urlencoded',
        },
    })

    // bisogna convertire le cose un po' in modo strano perché fetch si comporta in modo stranissimo
    // per via dell'encoding diciamo inusuale usato dal sito del poli
    response.headers.set('content-type', 'text/html')
    let buf = await blobToBuffer(await response.blob())
    return buf.toString()
}

export interface Lesson {
    name: string
    startingSegment: number
    length: number
    day: number
    room: string
    startTime: string
    endTime: string
}

/**
 * L'orario delle lezioni è il servizio 398, viene passato body POST semestre=2 per ottenere il
 * secondo semestre, qualsiasi altro valore restituisce il primo semestre
 */
export async function getCalendar(token: string): Promise<Lesson[]> {
    let html = await call(token, 398, { semestre: 2 })
    let dom = parse(html)

    // scraping un po' a caso per ottenere i singoli orari, un casino ma funziona
    let lessons: Lesson[] = []
    let currentDay = 0
    dom.querySelectorAll('.normalRow').forEach(row => {
        let startingCounter = 0
        let room = ''
        row.childNodes.forEach(node => {
            if (!node.classNames) return
            else if (node.classNames.includes('data')) currentDay++
            else if (node.classNames.includes('dove') && node.childNodes[1])
                room = node.childNodes[1].text.trim()
            else if (node.classNames.includes('css_prima_riga')) startingCounter++
            else if (node.classNames.includes('slot')) {
                let length = parseInt(node.attributes['colspan'])
                let name = node.childNodes[1].rawText.split('>')[1].trim()
                name = name.split('lezione')[0].split('esercitazione')[0]
                lessons.push({
                    name,
                    startingSegment: startingCounter,
                    length,
                    day: currentDay,
                    room,
                    startTime: segmentToTimeString(startingCounter),
                    endTime: segmentToTimeString(startingCounter + length),
                })
                startingCounter += length
            }
        })
    })

    return lessons
}

// export async function getCarriera(token: string) {
//     let html = await call(token, 2161) // [invalid scope]? dont know which scopes are possible
//     // console.log(html)
//     let dom = parse(html)
//     let fields = dom.querySelectorAll('.TableDati-tbody td')
//     return {
//         firstName: fields[2].text.trim(),
//         lastName: fields[1].text.trim(),
//         personCode: fields[0].text.trim(),
//     }
// }