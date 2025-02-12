function getHighlightsHTML(highlightsField,fieldName){
    const highlightedStrings = highlightsField
        .filter(h => h.path == fieldName)
        .map(h => {
        return h.texts.map(t => {
            if(t.type === "hit"){
            return "<strong style='color:blue'>"+t.value+"</strong>"
            }else{
            return t.value
            }
        }).join('')
        
    });
    return highlightedStrings;
}

function createHighlighting(highlightsField,fieldName,fieldValue) {
    const highlightedStrings = getHighlightsHTML(highlightsField,fieldName);

    const nonHighlightedStrings = highlightsField
        .filter(h => h.path == fieldName)
        .map(h => {
        return h.texts.map(t => t.value).join('')
    });

    highlightedStrings.forEach((str,idx) => {
        fieldValue = fieldValue.replace(nonHighlightedStrings[idx],str);
    });

    return {__html: fieldValue};
}

export default createHighlighting;