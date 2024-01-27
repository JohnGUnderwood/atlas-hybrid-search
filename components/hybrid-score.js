import { palette } from '@leafygreen-ui/palette';

function HybridScore({result}) {
    return (
        <div style={{paddingTop:"5px"}}>
            <em style={{fontSize:"smaller"}}>Scoring for this result:</em>
            <div key={`${result._id}scores`} style={{display:"grid",gridTemplateColumns:"45px 4lvh 50% 4lvh 45px",gap:"5px",alignItems:"start"}}>
                <div style={{color:palette.gray.base, fontSize:"smaller"}}>Lexical</div>
                <span>{`${Math.round((result.fts_score/result.score)*100)}%`}</span>
                <div>
                    <span style={{display:"inline-block", borderTopLeftRadius:"5px", borderBottomLeftRadius:"5px", height:"5px", backgroundColor:palette.gray.base, width:`${Math.round((result.fts_score/result.score)*100)}%`}}></span>
                    <span style={{display:"inline-block", borderTopRightRadius:"5px", borderBottomRightRadius:"5px", height:"5px", backgroundColor:palette.green.dark3, width:`${Math.round((result.vs_score/result.score)*100)}%`}}></span>
                </div>
                <span>{`${Math.round((result.vs_score/result.score)*100)}%`}</span>
                <div style={{color:palette.green.dark3, fontSize:"smaller"}}>Vector</div>
            </div>
        </div>
    )
}

export default HybridScore;