# Session Report - 2026-07-03

## Goal
Add MongoDB in-pipeline `$rerank` as a configurable, demonstrable option that shows up in the "Show Query" pipeline modal, applied across all search types, while keeping the existing external (API-based) reranking capability intact and backwards compatible.

## Design
Two clearly separated reranking mechanisms:

1. **In-pipeline `$rerank` (MongoDB-native)** — a `$rerank` stage appended client-side to the search pipeline before it is sent to `api/search`. Because `api/search` returns the executed pipeline (`response.query`), the stage automatically appears in the "Show Query" modal. Available only when a native reranker is configured (`RERANK_PROVIDER=native`).
2. **App-level rerank (external providers)** — the existing "Use Reranker" checkbox in `components/results.js`, which posts to `api/rerank` for external providers (voyageai/atlas). Left untouched for backwards compatibility.

The two modes are mutually exclusive by provider: the app-level checkbox is now shown only for non-native providers; the in-pipeline toggle is shown only for the native provider. This avoids double reranking.

## Changes

### `lib/pipelineStages.js`
- Standardized `rerankStage(query, path, modelName, numDocsToRerank)` to an unambiguous signature matching the `$rerank` syntax (`{ query:{text}, path, numDocsToRerank, model }`). Removed the previous shape-guessing (`model.reranking?.model`, `config.params.numCandidates.val`).
- Added `rerankParam(model)` — returns a SetParams-compatible checkbox config param when the native reranker is available, else `{}` (safe to spread).
- Added `appendRerankStage(pipeline, {query, schema, model, config})` — appends `$rerank` + `{$addFields:{score:{$meta:"score"}}}` when the toggle is enabled and provider is native; otherwise returns the pipeline unchanged. Rerank `path` uses the standardized projected field names (`title`, `description`, ...`searchFields`) that every search component produces.

### `middleware/models/native.js`
- Updated the `rerankStage` call to the new signature and built `path` defensively from projected field names. Added `.toArray()` to the `$documents` aggregation (previously returned an unresolved cursor).

### `pages/api/search.js`
- Removed the broken/half-wired server-side rerank block (typo `rerannk`, object-vs-string provider comparison, and reliance on `schema`/`config` that clients never sent). Also removed the now-unused `rerankStage` import. `api/search` is again a pure pipeline executor.

### `components/results.js`
- App-level "Use Reranker" checkbox now shown only when `model.reranking.provider` exists **and is not `native`**. Removed unused `rerankStage` import.

### Search components (in-pipeline toggle wired in)
Each pulls `model` from context, spreads `...rerankParam(model)` into its config params, passes `model` (and `query` where missing) into its `search()` function, and calls `appendRerankStage(...)` before posting:
- `components/vs.js`
- `components/rsf.js`
- `components/rrf.js`
- `components/steering.js`
- `components/semanticBoosting.js` (appends to the lexical pipeline)
- `components/fts.js` (added a `SetParams` panel, rendered only when the toggle param exists)

### `components/rerankFusion.js`
- Fixed the native branch: now appends the `$rerank` stage in-pipeline (visible in the modal), posts once to `api/search`, and uses the server-returned executed pipeline as `query`. Removed the buggy `{response, rerankResponse}` destructure and old `rerankStage` signature.
- External branch (post-processing via `api/rerank`) left unchanged.

## Validation
- Error check across all edited files: no errors.
- `npm run build`: compiled successfully; all routes generated.

## Notes / Follow-ups
- The in-pipeline rerank score is surfaced via `{$meta:"score"}`. If a deployment exposes the rerank score under a different meta name, adjust `appendRerankStage` and `rerankFusion.js` accordingly.
- The native `api/rerank` (`$documents`) path still depends on `req.body.db`, which clients don't currently send; the in-pipeline approach supersedes it for native reranking demos.

## Follow-up (2026-07-14): Debugging "no rerank option" + api/rerank crash

### Symptoms
1. Rerank toggle never appeared despite `RERANK_PROVIDER="native"` in `.env`.
2. Rerank Fusion threw `TypeError: Cannot read properties of undefined (reading 'rerank')` at `pages/api/rerank/index.js:13` (`req.rerank_model` undefined).

### Root cause
Both symptoms had one cause: `/api/model` returned `reranking:{}` because `req.rerank_model` was undefined server-side. `middleware/model.js` initializes the model once via a module-level singleton (`modelInstance` + top-level `modelInitPromise = initializeModel()`). `next dev` does not re-run this on `.env` changes or hot reloads — only a real module recompile does. The running server had cached state from before `RERANK_PROVIDER=native` took effect, so the native reranker was never constructed. With `model.reranking.provider` undefined on the client, the toggle was hidden and Rerank Fusion fell through to the external `api/rerank` path, which then crashed on the undefined `rerank_model`.

Verified the env/code were correct: `@next/env` and dotenv both resolve `RERANK_PROVIDER=[native]`; a forced recompile produced `Using Native reranking` and `/api/model` then returned `reranking:{provider:"native",model:"rerank-2.5"}`.

### Fix
- No code change needed for the core bug — a clean server restart / recompile re-initializes the model correctly.
- Hardened `pages/api/rerank/index.js` with a boundary guard: returns HTTP 400 with a clear "No reranking model configured" message when `req.rerank_model` is missing, instead of the cryptic `TypeError`.

### Validation
- `/api/model` returns `reranking:{provider:"native",model:"rerank-2.5"}`.
- Error check on `middleware/model.js` and `pages/api/rerank/index.js`: no errors.

## Follow-up (2026-07-15): Editable in-pipeline rerank query

### Goal
Allow the native `$rerank` query text to differ from the main search query while keeping the rerank control in the left-hand configuration panel.

### Changes
- `rerankParam(model)` now adds a text parameter that is visible only while the native rerank checkbox is enabled.
- The text field displays the current main query by default. A user edit is tagged with the query it was made for, so changing the main query automatically discards the stale edit without a synchronization hook or additional state file.
- `appendRerankStage(...)` uses the edited text when it belongs to the current query; otherwise it uses the current main query.
- FTS, Vector Search, RRF, RSF, Semantic Boosting, and Steering now pass their current query to `SetParams`.
- External API reranking remains unchanged.

### Validation
- Editor error checks passed for the shared parameter and pipeline helpers and all six updated search components.
- `npm run build` passes.

## Follow-up (2026-07-15): Simplified native rerank comparison

### Goal
Preserve the visible native `$rerank` pipeline and cached comparison experience without using `$group`, `$unwind`, `$replaceRoot`, or `$switch` stages to track result movement.

### Design
- Native and external reranking now share the Results-level "Use Reranker" control and cached toggle behavior.
- A native rerank request appends `$rerank` and a score projection to the executed base pipeline returned by `api/search`, then executes that pipeline in a separate request.
- Result movement is computed client-side by comparing document `_id` positions in the base and reranked arrays.
- The query modal shows the base pipeline when reranking is off and the executed `$rerank` pipeline when reranking is on.
- The editable native rerank query remains available beside the Results control. This supersedes the earlier left-panel implementation described above.

### Changes
- Simplified `rerankStages(...)` to `$rerank` plus an `$addFields` score projection.
- Removed `rerankParam(...)` and `appendRerankStage(...)` and their wiring from FTS, Vector Search, RRF, RSF, Semantic Boosting, and Steering.
- Added native rerank request caching, client-side movement annotation, reranked-pipeline caching, and stale-request protection to `Results`.
- Routed both native and external rerank responses through the same client-side movement annotation. Atlas and Voyage adapters now return only reordered documents and rerank scores.
- Rerank Fusion continues to rerank automatically, but now uses the simplified pipeline without movement annotations.

### Validation
- Editor diagnostics pass for all touched runtime files.
- `npm run build` passes.

