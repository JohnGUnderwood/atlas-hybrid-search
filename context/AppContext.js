import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AppContext = createContext();

export function AppProvider({ children}) {
    const [model, setModel] = useState(null);
    const [schema, setSchema] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('api/model')
            .then(response => {
                setModel(response.data);
                setIsLoading(false);
            })
            .catch(error => {
                setError(error);
                setIsLoading(false);
                console.error('Failed to load model:', error);
            })
            .finally(() => {
                setIsLoading(false);
        });
        axios.get('api/schema')
            .then(response => {
                setSchema(response.data);
                setIsLoading(false);
            })
            .catch(error => {
                setError(error);
                setIsLoading(false);
                console.error('Failed to load schema:', error);
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
        <AppContext.Provider value={{model,schema}}>
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