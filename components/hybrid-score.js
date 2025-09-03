import { palette } from '@leafygreen-ui/palette';

function HybridScore({result,method=null,weights=null}) {

    var fts_contribution = result.fts_score;
    var vector_contribution = result.vs_score;
        
    if(method == "avg"){
        fts_contribution = fts_contribution/2;
        vector_contribution = vector_contribution/2;
    }else if(method == "max"){
        fts_contribution = fts_contribution > vector_contribution ? result.score : 0;
        vector_contribution = vector_contribution > fts_contribution ? result.score : 0;
    }else if(method == "sum"){
        if(weights && weights.vector && weights.fts){
            fts_contribution *= weights.fts;
            vector_contribution *= weights.vector;
        }
    }
    else if(method == null){
        fts_contribution = result.fts_score;
        vector_contribution = result.vs_score;
    }
    
    

    return (
        <div style={{paddingTop:"5px"}}>
            <em style={{fontSize:"smaller"}}>Scoring for this result: {`${fts_contribution.toFixed(3)} + ${vector_contribution.toFixed(3)} = ${result.score.toFixed(3)}`}</em>
            <div key={`${result._id}scores`} style={{display:"grid",gridTemplateColumns:"45px 4lvh 50% 4lvh 45px",gap:"5px",alignItems:"start"}}>
                <div style={{color:palette.blue.light1, fontSize:"smaller"}}>Lexical</div>
                <span style={{color:palette.blue.light1, fontSize:"smaller"}}>{`${Math.round((fts_contribution/result.score)*100)}%`}</span>
                <div>
                    {fts_contribution == result.score ?
                    <span style={{
                        display:"inline-block",
                        borderRadius:"5px",
                        height:"5px",
                        backgroundColor:palette.blue.light1,
                        width:`${Math.round((fts_contribution/result.score)*100)}%`}}></span>
                    :<span style={{
                        display:"inline-block",
                        borderTopLeftRadius:"5px",
                        borderBottomLeftRadius:"5px",
                        height:"5px",
                        backgroundColor:palette.blue.light1,
                        width:`${Math.round((fts_contribution/result.score)*100)}%`}}></span>}
                    
                    {vector_contribution == result.score ?
                    <span style={{
                        display:"inline-block",
                        borderRadius:"5px",
                        height:"5px",
                        backgroundColor:palette.green.dark1,
                        width:`${Math.round((vector_contribution/result.score)*100)}%`}}></span>
                    :<span style={{
                        display:"inline-block",
                        borderTopRightRadius:"5px",
                        borderBottomRightRadius:"5px",
                        height:"5px",
                        backgroundColor:palette.green.dark1,
                        width:`${Math.round((vector_contribution/result.score)*100)}%`}}></span>
                    }
                </div>
                <span style={{color:palette.green.dark1, fontSize:"smaller"}}>{`${Math.round((vector_contribution/result.score)*100)}%`}</span>
                <div style={{color:palette.green.dark1, fontSize:"smaller"}}>Vector</div>
            </div>
        </div>
    )
}

export default HybridScore;