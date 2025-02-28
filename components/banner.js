import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import { H1, H2} from "@leafygreen-ui/typography";
import { useModel } from '../context/ModelContext';

function AppBanner({heading,children}){
    const model = useModel();
    return(
        <div>
            <div style={{marginRight:"auto"}}>
                <div style={{display:"flex",alignItems:"center", justifyContent:"space-between"}}>
                    <H1><MongoDBLogoMark/>{heading}</H1>
                    <div>
                        <p>embeddings: {model.embedding?.provider} - {model.embedding?.model}</p>
                        {model.reranking?.provider?<p>reranking: {model.reranking?.provider} - {model.reranking?.model}</p>:<></>}
                    </div>
                </div>
            </div>
            <div>
                {children}
            </div>
        </div>
    )
}

export default AppBanner;