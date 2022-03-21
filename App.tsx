import React, { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack'
import AsyncStorage from '@react-native-async-storage/async-storage'

import { LoginContext, RootStackParamList, WebPage } from './pages/Login'
import { Home } from './pages/Home';

// stack navigator per controllare la navigazione tra la homepage e la pagina di login
let Stack = createStackNavigator<RootStackParamList>()

export default function App() {
    let [token, setToken] = useState<string>()

    useEffect(() => {
        // quando viene caricata l'app, viene cercato il token dallo storage, se c'è viene settato
        // nel context
        AsyncStorage.getItem('poliauth:token').then(tkn => {
            if (tkn) setToken(tkn)
        })
    }, [])

    return <LoginContext.Provider value={{
        token,
        setToken: async tkn => {
            // quando viene updatato il token nel context, setta il valore nello state e salva (o 
            // cancella eventualmente) il token nello storage per essere riottenuto al prossimo avvio
            setToken(tkn)
            if (tkn) await AsyncStorage.setItem('poliauth:token', tkn)
            else await AsyncStorage.removeItem('poliauth:token')
        }
    }}>
        <StatusBar style="auto" />
        <NavigationContainer>
            <Stack.Navigator>
                <Stack.Screen
                    // home page
                    name='home'
                    component={Home}
                />
                <Stack.Screen
                    // pagina di login
                    name='web'
                    component={WebPage}
                />
            </Stack.Navigator>
        </NavigationContainer>
    </LoginContext.Provider>
}