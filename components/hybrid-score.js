import { palette } from '@leafygreen-ui/palette';

function HybridScore({result}) {
    return (
        <div style={{paddingTop:"5px"}}>
            <em style={{fontSize:"smaller"}}>Scoring for this result: {`${result.fts_score.toFixed(3)} + ${result.vs_score.toFixed(3)} = ${result.score.toFixed(3)}`}</em>
            <div key={`${result._id}scores`} style={{display:"grid",gridTemplateColumns:"45px 4lvh 50% 4lvh 45px",gap:"5px",alignItems:"start"}}>
                <div style={{color:palette.blue.light1, fontSize:"smaller"}}>Lexical</div>
                <span style={{color:palette.blue.light1, fontSize:"smaller"}}>{`${Math.round((result.fts_score/result.score)*100)}%`}</span>
                <div>
                    {result.fts_score == result.score ?
                    <span style={{
                        display:"inline-block",
                        borderRadius:"5px",
                        height:"5px",
                        backgroundColor:palette.blue.light1,
                        width:`${Math.round((result.fts_score/result.score)*100)}%`}}></span>
                    :<span style={{
                        display:"inline-block",
                        borderTopLeftRadius:"5px",
                        borderBottomLeftRadius:"5px",
                        height:"5px",
                        backgroundColor:palette.blue.light1,
                        width:`${Math.round((result.fts_score/result.score)*100)}%`}}></span>}
                    
                    {result.vs_score == result.score ?
                    <span style={{
                        display:"inline-block",
                        borderRadius:"5px",
                        height:"5px",
                        backgroundColor:palette.green.dark1,
                        width:`${Math.round((result.vs_score/result.score)*100)}%`}}></span>
                    :<span style={{
                        display:"inline-block",
                        borderTopRightRadius:"5px",
                        borderBottomRightRadius:"5px",
                        height:"5px",
                        backgroundColor:palette.green.dark1,
                        width:`${Math.round((result.vs_score/result.score)*100)}%`}}></span>
                    }
                </div>
                <span style={{color:palette.green.dark1, fontSize:"smaller"}}>{`${Math.round((result.vs_score/result.score)*100)}%`}</span>
                <div style={{color:palette.green.dark1, fontSize:"smaller"}}>Vector</div>
            </div>
        </div>
    )
}

export default HybridScore;