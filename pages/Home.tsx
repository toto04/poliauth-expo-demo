import React, { FC, useContext, useEffect, useState } from 'react';
import { Pressable, Text, View, Dimensions } from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { ScrollView } from 'react-native-gesture-handler';
import { LoginContext, RootStackParamList } from './Login';
import { getCalendar, Lesson } from '../api';

/**
 * questo è soltanto il componente per creare un calendario molto stupido per mostrare le lezioni
 */
export let Calendar: FC<{ lessons: Lesson[] }> = props => {
    // these are just a bunch of empty views for quickly displaying lines
    let lines: JSX.Element[] = [];
    for (let i = 0; i < 48; i++) {
        lines.push(<View key={'vertical' + i} style={{
            position: 'absolute',
            left: i / 0.48 + '%',
            backgroundColor: i % 4 ? '#ccc' : '#888',
            height: 600 / 7 + '%',
            width: i % 4 ? 1 : 2,
            top: 50,
        }}></View>);
    }
    for (let i = 0.5; i < 7; i++) {
        lines.push(<View key={'horiz' + i} style={{
            position: 'absolute',
            left: 0,
            width: '100%',
            height: 1,
            top: i / 0.07 + '%',
            backgroundColor: '#ccc'
        }}></View>);
    }

    return <ScrollView horizontal style={{
        flex: 1,
        minWidth: '100%',
        padding: 12,
    }}>
        {lines}
        <Text style={{
            fontSize: 36,
            fontWeight: 'bold',
            width: Dimensions.get('screen').width * 2
        }}>Lezioni:</Text>
        {props.lessons.map((l, i) => <View
            key={'lesson' + i}
            style={{
                position: 'absolute',
                width: l.length / 0.48 + '%',
                left: l.startingSegment / 0.48 + '%',
                top: (l.day - 0.5) / 0.07 + '%',
                padding: 4,
                borderRadius: 4,
                margin: 2,
                backgroundColor: '#ddd',
                shadowColor: '#222',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
            }}
        >
            <Text style={{
                fontSize: 16,
                fontWeight: 'bold',
            }}>{l.name}</Text>
            <Text>Orario: {l.startTime} - {l.endTime}</Text>
            <Text>Aula: {l.room}</Text>
        </View>)}
    </ScrollView>
}

/**
 * componente della prima pagina, mostra un tasto di login se non c'è un token nel context, o 
 * o il calendario se sonos tate caricate le lezioni
 */
export let Home: FC<StackScreenProps<RootStackParamList, 'home'>> = props => {
    let { token, setToken } = useContext(LoginContext);

    // let [carriera, setCarriera] = useState<Awaited<ReturnType<typeof getCarriera>>>()
    let [lessons, setLessons] = useState<Awaited<ReturnType<typeof getCalendar>>>();

    useEffect(() => {
        if (token) {
            // se viene aggiunto un token carica le lezioni
            getCalendar(token).then(ls => {
                setLessons(ls);
            });
        }
    }, [token]);

    return <View style={{
        position: 'relative',
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
    }}>
        {token
            ? <>
                {lessons
                    ? <Calendar lessons={lessons} />
                    : <Text>Caricamento...</Text>}
                <Pressable
                    style={{
                        position: 'absolute',
                        right: 20,
                        bottom: 20,
                        backgroundColor: '#ff3b30',
                        padding: 12,
                        borderRadius: 12,
                        shadowColor: '#ff3b30',
                        shadowOffset: { height: 2, width: 0 },
                        shadowOpacity: .8,
                        shadowRadius: 8,
                    }}
                    onPress={() => { setToken(undefined) }}
                >
                    <Text style={{ color: 'white' }}>Logout</Text>
                </Pressable>
            </>
            : <Pressable
                style={{
                    padding: 16,
                    backgroundColor: '#34c759',
                    borderRadius: 12,
                }}
                onPress={() => {
                    console.log('press!');
                    props.navigation.navigate('web');
                }}
            >
                <Text style={{
                    fontSize: 40,
                    color: 'white',
                    fontWeight: 'bold',
                }}>
                    Login
                </Text>
            </Pressable>
        }
    </View>;
};
