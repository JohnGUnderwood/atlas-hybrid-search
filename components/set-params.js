import { Label } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import LoadingIndicator from "./LoadingIndicator";
import { Select, Option } from '@leafygreen-ui/select';
import styles from "./shared.module.css";

function SetParams({loading,config,heading,query='',resetConfig=null,setConfig}){
    const handleSliderChange = (param, newValue) => {
        let updatedConfig = {
          ...config,
          [param]: {
              ...config[param],
              val: parseFloat(newValue)
          }
        };
  
        // Ensure numCandidates >= limit
        if (param === "limit" && parseFloat(newValue) > config.numCandidates.val) {
            updatedConfig.numCandidates = {
                ...config.numCandidates,
                val: parseFloat(newValue)
            };
        }else if (param === "numCandidates" && parseFloat(newValue) < config.limit.val) {
            updatedConfig.limit = {
                ...config.limit,
                val: parseFloat(newValue)
            };
        }
  
        setConfig(prev => ({...prev, params: {...prev.params, ...updatedConfig}}));
    };

    const handleMultiChange = (param, value) => {
        let updatedConfig = {
            ...config,
            [param]: {
                ...config[param],
                val: value
            }
        };
        setConfig(prev => ({...prev, params: {...prev.params, ...updatedConfig}}));
    };

    const handleCheckboxChange = (param, checked) => {
        let updatedConfig = {
            ...config,
            [param]: {
                ...config[param],
                val: checked
            }
        };
        setConfig(prev => ({...prev, params: {...prev.params, ...updatedConfig}}));
    };

    const handleTextChange = (param, value) => {
        let updatedConfig = {
            ...config,
            [param]: {
                ...config[param],
                val: value,
                editedForQuery: query
            }
        };
        setConfig(prev => ({...prev, params: {...prev.params, ...updatedConfig}}));
    };

    return (
        <div>
            <h2>{heading}</h2>
            {resetConfig? <div style={{maxWidth:"60px"}}><Button onClick={()=>resetConfig()} variant="primary">Reset</Button></div>:<></>}
            {Object.keys(config).filter(param => {
                const dependency = config[param].dependsOn;
                return config[param].type !== "hidden" && (!dependency || config[dependency]?.val);
            }).map(param=>{
                try{
                    return (
                        <div key={param}>
                        <p key={param+"_title"}><Label>{param}</Label></p>
                        <p key={param+"_comment"} className={styles['param-comment']}>{config[param]['comment']}</p>
                        {config[param]['type'] === 'range'?
                            (
                                <Label key={param}>
                                    <input
                                        key={param+'_slider'}
                                        style={{verticalAlign:"bottom"}}
                                        type="range"
                                        min={config[param]['range'][0]} 
                                        max={config[param]['range'][1]}
                                        step={config[param]['step']} 
                                        value={config[param]['val']} 
                                        onChange={(e) => handleSliderChange(param, e.target.value)}
                                    />
                                    <input
                                        key={param+'_box'}
                                        style={{width:"3lvh"}}
                                        type="text"
                                        value={config[param]['val']} 
                                        onChange={(e) => handleSliderChange(param, e.target.value)}
                                    />
                                </Label>
                            )
                            :
                            config[param]['type'] === 'multi' ?
                            (
                                
                                <Select
                                    key={param + '_select'}
                                    value={config[param]['val']}
                                    onChange={(value) => handleMultiChange(param, value)}
                                >
                                    {config[param]['options'].map(option => (
                                        <Option key={option} value={option}>{option}</Option>
                                    ))}
                                </Select>
                            )
                            :
                            config[param]['type'] === 'checkbox' ?
                            (
                                <Label key={param}>
                                    <input
                                        key={param+'_checkbox'}
                                        type="checkbox"
                                        checked={config[param]['val']}
                                        onChange={(e) => handleCheckboxChange(param, e.target.checked)}
                                    />
                                </Label>
                            )
                            :
                            config[param]['type'] === 'text' ?
                            (
                                <input
                                    key={param+'_text'}
                                    style={{width:"100%"}}
                                    type="text"
                                    value={config[param]['editedForQuery'] === query ? config[param]['val'] : query}
                                    onChange={(e) => handleTextChange(param, e.target.value)}
                                />
                            )
                            :
                            null
                        }
                        </div>
                    )
                }
                catch(e){
                    console.log(e);
                    console.log(`error rendering ${param} param. skipping...`);
                }
            })}

        {loading?<LoadingIndicator description="Loading..."/>:<></>}
        </div>
    )
}

export default SetParams;