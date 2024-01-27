import {SearchResult} from '@leafygreen-ui/search-input';
import { H1, Subtitle, Description, } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';
import HybridScore from "./hybrid-score";

function Results({results,msg,hybrid}){
    return (
        <div style={{paddingLeft:"40px",paddingRight:"40px"}}>
            <div style={{paddingTop:"25px"}}>
                {msg ?
                <em>{msg}</em>
                :<></>
                }
                {
                results && results.length > 0
                ?
                <div>
                    {results.map(r => (
                        <SearchResult key={r._id}>
                            <Card>
                                <Subtitle key={`${r._id}title`} style={{paddingBottom:"5px"}}>
                                {r.title}
                                </Subtitle>
                                <div style={{display:"grid",gridTemplateColumns:"60px 90%",gap:"5px",alignItems:"start"}}>
                                    <img src={r.image} style={{maxHeight:"75px",maxWidth:"60px"}}/>
                                    <div>
                                        <Description key={`${r._id}desc`}>
                                            {r.description}
                                        </Description>
                                        {hybrid ?
                                            <HybridScore result={r} key={`${r._id}scores`}/>
                                        :<></>
                                        }
                                    </div>
                                </div>
                            </Card>
                        </SearchResult>
                    ))}
                </div>
                :
                <></>
                }
            </div>
        </div>
    )
}

export default Results;