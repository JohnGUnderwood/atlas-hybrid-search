import { Label } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';
import LoadingIndicator from "./LoadingIndicator";

function SetParams({loading,config,heading,resetConfig,handleSliderChange}){
    return (
        <div>
            <h2>{heading}</h2>
            <div style={{maxWidth:"60px"}}><Button onClick={()=>resetConfig()} variant="primary">Reset</Button></div>
            {Object.keys(config).map(param=>{
                try{
                    return (
                        <div key={param}>
                        <p key={param+"_title"}>{param}</p>
                        <p key={param+"_comment"}><i key={param+"_comment_i"}>{config[param]['comment']}</i></p>
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
                        </div>
                    )
                }
                catch(e){
                    console.log(`error rendering ${param} param. skipping...`);
                }
            })}

        {loading?<LoadingIndicator description="Loading..."/>:<></>}
        </div>
    )
}

export default SetParams;