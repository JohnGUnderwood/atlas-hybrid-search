import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const ModelContext = createContext();

export function ModelProvider({ children}) {
    const [model, setModel] = useState(null);
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
    },[]);

    if (isLoading) {
        return <div>Loading model configuration...</div>;
    }

    if (error) {
        return <div>Error loading model: {error.message}</div>;
    }

    return (
        <ModelContext.Provider value={model}>
            {children}
        </ModelContext.Provider>
    );
}

export function useModel() {
    const context = useContext(ModelContext);
    if (context === undefined) {
        throw new Error('useModel must be used within ModelProvider');
    }
    return context;
}