import { Label } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import LoadingIndicator from "./LoadingIndicator";
import { Select, Option } from '@leafygreen-ui/select';

function SetParams({loading,config,heading,resetConfig=null,setConfig}){
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
  
        setConfig(prev => ({...prev, ...updatedConfig}));
    };

    const handleMultiChange = (param, value) => {
        let updatedConfig = {
            ...config,
            [param]: {
                ...config[param],
                val: value
            }
        };
        setConfig(prev => ({...prev, ...updatedConfig}));
    };

    const handleCheckboxChange = (param, checked) => {
        let updatedConfig = {
            ...config,
            [param]: {
                ...config[param],
                val: checked
            }
        };
        setConfig(prev => ({...prev, ...updatedConfig}));
    };

    return (
        <div>
            <h2>{heading}</h2>
            {resetConfig? <div style={{maxWidth:"60px"}}><Button onClick={()=>resetConfig()} variant="primary">Reset</Button></div>:<></>}
            {Object.keys(config).filter(param => config[param].type !== "hidden").map(param=>{
                try{
                    return (
                        <div key={param}>
                        <p key={param+"_title"}>{param}</p>
                        <p key={param+"_comment"}><i key={param+"_comment_i"}>{config[param]['comment']}</i></p>
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