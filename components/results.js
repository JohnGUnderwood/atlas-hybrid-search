import {SearchResult} from '@leafygreen-ui/search-input';
import { H1, Subtitle, Description, } from '@leafygreen-ui/typography';
import Card from '@leafygreen-ui/card';

function Results({results}){
    return (
        <div style={{display:"grid",gridTemplateColumns:"10% 80% 10%",gap:"0px",alignItems:"start"}}>
            <div style={{paddingTop:"225px"}}>
            {results && results[0] && results[0].facets && results[0].facets.facet
                ? 
                <Card>
                <Subtitle key={`${facetField}`}>{facetField}</Subtitle>
                    {results[0].facets.facet[`${facetField}`].buckets.map(bucket => (
                        <Description key={bucket._id} style={{paddingLeft:"15px"}}><span key={`${bucket._id}_label`} style={{cursor:"pointer",paddingRight:"5px", color:"blue"}}>{bucket._id}</span><span key={`${bucket._id}_count`}>({bucket.count})</span></Description>
                    ))}
                </Card>
                : <></>
            }
            </div>
            <div>
                {
                results && results.length > 0
                ?
                <div style={{maxWidth:"95%"}}>
                    {results.map(r => (
                    <SearchResult key={r._id}>
                        <Card>
                            <Subtitle key={`${r._id}title`} style={{paddingBottom:"5px"}}>
                            {r.title}
                            </Subtitle>
                            <div style={{display:"grid",gridTemplateColumns:"60px 90%",gap:"5px",alignItems:"start"}}>
                            <img src={r.image} style={{maxHeight:"75px"}}/>
                            <Description key={`${r._id}desc`}>
                                {r.highlights?.length > 0
                                ?
                                <span dangerouslySetInnerHTML={createHighlighting(r.highlights,descriptionField,r.description)} />
                                : 
                                r.description
                                }
                            </Description>
                            </div>
                        </Card>
                    </SearchResult>
                    ))}
                </div>
                :
                <></>
                }
            </div>
            <div></div>
        </div>
    )
}

export default Results;