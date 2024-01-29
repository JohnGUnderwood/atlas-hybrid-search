import { Label } from '@leafygreen-ui/typography';
import Button from '@leafygreen-ui/button';

function SetParams({config,heading,resetConfig,handleSliderChange}){
    return (
        <div>
                <h2>{heading}</h2>
                <div style={{maxWidth:"60px"}}><Button onClick={()=>resetConfig()} variant="primary">Reset</Button></div>
                {Object.keys(config).map(param=>(
                    <>
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
                    </>
                ))}
            
            </div>
    )
}

export default SetParams;