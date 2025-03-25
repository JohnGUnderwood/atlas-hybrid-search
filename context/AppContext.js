import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export function AppProvider({ children}) {
    const [model, setModel] = useState(null);
    const [schema, setSchema] = useState(null);
    const [indexes,setIndexes] = useState(null);
    const [sample, setSample] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const requests = [
            { url: 'api/model', setter: setModel },
            { url: 'api/schema', setter: setSchema },
            { url: 'api/indexes', setter: setIndexes },
            { url: 'api/sample', setter: setSample }
        ];

        Promise.all(
            requests.map(req => 
                axios.get(req.url)
                    .then(response => ({ success: true, data: response.data, setter: req.setter }))
                    .catch(error => ({ success: false, error, url: req.url }))
            )
        )
        .then(results => {
            let hasError = false;
            results.forEach(result => {
                if (result.success) {
                    result.setter(result.data);
                } else {
                    hasError = true;
                    console.error(`Failed to load ${result.url}:`, result.error);
                }
            });
            if (hasError) {
                setError(new Error('Failed to load one or more configurations'));
            }
        })
        .catch(error => {
            setError(error);
            console.error('Failed to load configurations:', error);
        })
        .finally(() => {
            setIsLoading(false);
        });
    },[]);

    if (isLoading) {
        return <div>Loading configuration...</div>;
    }

    if (error) {
        return <div>Error loading configuration: {error.message}</div>;
    }

    return (
        <AppContext.Provider value={{model,schema,indexes,sample}}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useApp must be used within AppProvider');
    }
    return context;
}