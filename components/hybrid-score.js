import { palette } from '@leafygreen-ui/palette';

function HybridScore({result,method,weights}) {

    var fts_details = result.scoreDetails.details.filter(item => item.inputPipelineName === "fullTextPipeline")[0];
    var vector_details = result.scoreDetails.details.filter(item => item.inputPipelineName === "vectorPipeline")[0];
    var fts_contribution;
    var vector_contribution;

    if(method == "rank"){
        fts_contribution = fts_details.rank > 0 ? weights.fts * (1/(fts_details.rank+60)) : 0;
        vector_contribution = vector_details.rank > 0 ? weights.vector * (1/(vector_details.rank+60)) : 0;
    }else {
        [fts_details,vector_details].forEach(d => {
            // if the value is not a number default to 0
            if(typeof d.value !== "number"){
                d.value = 0;
            }
        });
        if(method == "avg"){
            fts_contribution = fts_details.value/2;
            vector_contribution = vector_details.value/2;
        }else if(method == "max"){
            fts_contribution = fts_details.value > vector_details.value ? result.score : 0;
            vector_contribution = vector_details.value > fts_details.value ? result.score : 0;
        }else if(method == "sum"){
            if(weights && weights.vector && weights.fts){
                fts_contribution = weights.fts * fts_details.value;
                vector_contribution = weights.vector * vector_details.value;
            }
        }
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