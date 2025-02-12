import { Label } from "@leafygreen-ui/typography"
export default function ScalarSlider({value,handleSliderChange,labels=[],step=0.1,minMax=[0.0,1.0]}){
    const param = "scalar"
    return (
        <div style={{justifyContent:"center",display:'flex'}} >
            <Label style={{ marginRight: '10px' }}>{labels[0]? labels[0]:'Lexical Search Weight'}</Label>
            <input
                key={param}
                style={{width:'20vw'}}
                type="range"
                min={minMax[0]} 
                max={minMax[1]}
                step={step} 
                value={value} 
                onChange={(e) => handleSliderChange(e.target.value)}
            />
            <Label style={{ marginLeft: '10px' }}>{labels[1]? labels[1] : 'Semantic Search Weight'}</Label>
        </div>
    )
}