
function HybridScore({result}) {
    <div key={`${result._id}scores`} style={{display:"grid",gridTemplateColumns:"45px 50% 45px",gap:"5px",alignItems:"start"}}>
        <div>Lexical</div>
        <div>
            <span style={{display:"inline-block", borderTopLeftRadius:"5px", borderBottomLeftRadius:"5px", height:"5px", backgroundColor:"blue", width:`${Math.round((result.fts_score/result.score)*100)}%`}}></span>
            <span style={{display:"inline-block", borderTopRightRadius:"5px", borderBottomRightRadius:"5px", height:"5px", backgroundColor:"green", width:`${Math.round((result.vs_score/result.score)*100)}%`}}></span>
        </div>
        <div>Vector</div>
    </div>
}

export default HybridScore;