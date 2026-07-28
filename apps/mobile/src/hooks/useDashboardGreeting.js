import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    DASHBOARD_VISIT_STORAGE_KEY,
    resolveDashboardGreetingPhrase,
} from '@waraqah/shared';

export function useDashboardGreeting() {
    const [greetingPhrase, setGreetingPhrase] = useState(null);

    useEffect(() => {
        let active = true;

        (async () => {
            let hasVisitedBefore = true;
            try {
                hasVisitedBefore =
                    (await AsyncStorage.getItem(DASHBOARD_VISIT_STORAGE_KEY)) === '1';
            } catch {
                /* storage blocked */
            }

            if (!active) return;

            setGreetingPhrase(resolveDashboardGreetingPhrase(hasVisitedBefore));

            try {
                await AsyncStorage.setItem(DASHBOARD_VISIT_STORAGE_KEY, '1');
            } catch {
                /* storage blocked */
            }
        })();

        return () => {
            active = false;
        };
    }, []);

    return greetingPhrase;
}
