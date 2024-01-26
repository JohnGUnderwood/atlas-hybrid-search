import { MongoDBLogoMark } from "@leafygreen-ui/logo";
import { H1 } from "@leafygreen-ui/typography";

function AppBanner({heading,children}){

    return(
        <div>
            <div style={{marginRight:"auto"}}>
                <H1><MongoDBLogoMark/>{heading}</H1>
            </div>
            <div>
                {children}
            </div>
        </div>
    )
}

export default AppBanner;