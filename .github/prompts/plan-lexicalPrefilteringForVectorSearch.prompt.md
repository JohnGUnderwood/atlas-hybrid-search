# Plan: Implement MongoDB Lexical Prefiltering for Vector Search

Consolidate the vector and text indexes into a unified search index structure, update all vector search aggregation pipelines to use MongoDB's new syntax with optional lexical prefiltering, and add a UI checkbox to enable/disable lexical prefiltering on search operations.

## Steps

1. **Update [create-search-indexes.mjs](create-search-indexes.mjs)** to consolidate vector field into the text index mappings instead of maintaining separate vector and text indexes.

2. **Modify [lib/getResults.js](lib/getResults.js)** to handle both legacy `$vectorSearch` and new `$search` syntax with vector prefiltering capabilities.

3. **Update all vector search component functions** ([components/vs.js](components/vs.js), [components/rsf.js](components/rsf.js), [components/rrf.js](components/rrf.js), etc.) to construct pipelines using the new syntax.

4. **Add a checkbox UI component** to [components/set-params.js](components/set-params.js) for toggling lexical prefiltering on/off.

5. **Implement dynamic `$preFilter` stage logic** in pipeline components to apply lexical filtering when checkbox is enabled.

6. **Update [pages/api/schema.js](pages/api/schema.js)** to validate and reflect the consolidated index structure.

## Further Considerations

### 1. Backward Compatibility
This is an entirely new version of the application. It will not need to support old syntax. The README will need to be updated to reflect the new syntax and index structure and highlight which version of MongoDB is required to use the new features.

### 2. Prefilter Field Selection
The lexical prefilter checkbox will simply activate the filtering. The logic in the stage will use the compound operator to apply the filter to all text fields in the index. There will not be an option to select specific fields for prefiltering at this time.

### 3. Testing Strategy
There are no tests of the API routes or search functionality at this time. Testing will be manual by running the application and verifying that the new index structure is created correctly, that searches work with and without prefiltering, and that the UI checkbox toggles the prefiltering as expected.
Creating automated tests is a future enhancement.

## Context: GitHub Issue #60

### Feature Request Overview
The issue requests three main changes to implement MongoDB's new lexical prefiltering capability for vector search:

1. **Consolidate Index Definitions**: Convert from separate vector and text indexes to a unified index where the vector field is defined under a single text index.

2. **Update Vector Search Syntax**: Replace the current aggregation stage with the new nested syntax that supports prefiltering.

3. **Add UI Checkbox**: Implement a "filter by lexical matches in vector search" checkbox that enables lexical prefiltering.

### Current Architecture Summary

- **Index Management**: Two separate indexes (searchIndex for text, vectorIndex for vector)
- **Search Pipeline**: Dynamic pipeline injection via `setIndexNames()`
- **Vector Search Implementation**: Uses `$vectorSearch` stage with path, queryVector, numCandidates, limit
- **Embedding Models**: Multiple providers (OpenAI, Azure, Mistral, Nomic, Voyage AI, Ollama)
- **Result Handling**: Display with highlighting, optional reranking, score breakdowns
- **Data Flow**: Query → Embed → Build Pipeline → Search API → Display Results

### Key Files Impacted

Priority order:
1. `create-search-indexes.mjs` - Index definition changes
2. `lib/getResults.js` - Pipeline processing updates
3. Component search functions - All using vector search
4. `pages/api/schema.js` - Index validation
5. `components/set-params.js` - UI controls for prefiltering checkbox
