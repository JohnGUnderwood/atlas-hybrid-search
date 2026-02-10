import { Label } from '@leafygreen-ui/typography';
import TextInput from '@leafygreen-ui/text-input';
import { SegmentedControl, SegmentedControlOption } from '@leafygreen-ui/segmented-control';
import { Select, Option } from '@leafygreen-ui/select';
import Icon from '@leafygreen-ui/icon';
import IconButton from '@leafygreen-ui/icon-button';
import { useState } from 'react';
import styles from "./shared.module.css";

function FilterFields({query, schema, config, setConfig, label, description}){
    const [selectedField, setSelectedField] = useState('');
    
    const filterConfig = config.filters;
    
    const allFields = [
        { name: schema.titleField, label: schema.titleField },
        { name: schema.descriptionField, label: schema.descriptionField },
        ...schema.searchFields.map(f => ({ name: f, label: f }))
    ];

    // Get fields that are currently active (have been added to filters)
    const activeFields = allFields.filter(field => field.name in filterConfig);
    
    // Get fields available to add (not yet in filters)
    const availableFields = allFields.filter(field => !(field.name in filterConfig));

    const handleAddField = (fieldName) => {
        if (fieldName && !(fieldName in filterConfig)) {
            setConfig({
                ...config,
                filters: {
                    ...filterConfig,
                    [fieldName]: {
                        query: query || '',
                        matchCriteria: 'any'
                    }
                }
            });
            setSelectedField('');
        }
    };

    const handleQueryChange = (fieldName, value) => {
        setConfig({
            ...config,
            filters: {
                ...filterConfig,
                [fieldName]: {
                    ...filterConfig[fieldName],
                    query: value
                }
            }
        });
    };

    const handleMatchCriteriaChange = (fieldName, value) => {
        setConfig({
            ...config,
            filters: {
                ...filterConfig,
                [fieldName]: {
                    ...filterConfig[fieldName],
                    matchCriteria: value
                }
            }
        });
    };

    const handleOperatorChange = (value) => {
        setConfig({
            ...config,
            filters: {
                ...filterConfig,
                __operator: value
            }
        });
    }

    const removeField = (fieldName) => {
        const newFilters = { ...filterConfig };
        delete newFilters[fieldName];
        setConfig({
            ...config,
            filters: newFilters
        });
    };

    const clearAllFields = () => {
        setConfig({
            ...config,
            filters: {}
        });
    };

    const hasAnyFilters = activeFields.length > 0;

    return (
        <div style={{marginBottom:"20px", marginTop:"20px"}}>
            <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"10px"}}>
                <Label>{label || "Filter Retrieval"}</Label>
                {hasAnyFilters && (
                    <IconButton 
                        aria-label="Clear all filters"
                        onClick={clearAllFields}
                    >
                        <Icon glyph="X" />
                    </IconButton>
                )}
            </div>
            <p className={styles['param-comment']}>{description || "Add filters to text and vector searches"}</p>
            
            {availableFields.length > 0 && (
                <div style={{marginBottom:"15px"}}>
                    <Select
                        placeholder="Add filter field..."
                        value={selectedField}
                        onChange={(value) => handleAddField(value)}
                        aria-label="Select field to filter"
                    >
                        {availableFields.map((field, idx) => (
                            <Option key={idx} value={field.name}>{field.label}</Option>
                        ))}
                    </Select>
                </div>
            )}
            
            {activeFields.map((field, idx) => (
                <div key={idx} style={{marginBottom:"15px", padding:"10px", backgroundColor:"#f9fafb", borderRadius:"6px"}}>
                    <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"8px"}}>
                        <Label style={{fontSize:"13px", fontWeight:"600"}}>{field.label}</Label>
                        <IconButton 
                            aria-label={`Remove ${field.label} filter`}
                            onClick={() => removeField(field.name)}
                            size="small"
                        >
                            <Icon glyph="X" size="small" />
                        </IconButton>
                    </div>
                    <div style={{display: "flex", marginBottom:"8px"}}>
                        <TextInput
                            label=""
                            placeholder={`Search ${field.label}...`}
                            value={filterConfig[field.name]?.query || ''}
                            onChange={(e) => handleQueryChange(field.name, e.target.value)}
                            style={{flex: 1, minWidth: 0}}
                        />
                    </div>
                    <SegmentedControl
                        label="Match Terms"
                        value={filterConfig[field.name]?.matchCriteria || 'any'}
                        onChange={(value) => handleMatchCriteriaChange(field.name, value)}
                        size="small"
                        style={{marginTop:"5px"}}
                    >
                        <SegmentedControlOption value="any">Any</SegmentedControlOption>
                        <SegmentedControlOption value="all">All</SegmentedControlOption>
                    </SegmentedControl>
                </div>
            ))}

            {activeFields.length > 1 && (
                <SegmentedControl
                        label="Match Fields"
                        value={filterConfig?.__operator || 'should'}
                        onChange={(value) => handleOperatorChange(value)}
                        size="small"
                    >
                    <SegmentedControlOption value="should">Any</SegmentedControlOption>
                    <SegmentedControlOption value="must">All</SegmentedControlOption>
                </SegmentedControl>
            )}
        </div>
    )
}

export default FilterFields;