# Meeting Notes OpenAI-Compatible Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing transcription flow so a completed transcript can generate structured meeting notes through an OpenAI-compatible API.

**Architecture:** Keep the existing transcription pipeline unchanged and add a second synchronous generation path that consumes transcript text. The backend owns prompt construction, provider configuration, and JSON parsing; the frontend adds a meeting-notes tab and actions on top of the current result view.

**Tech Stack:** FastAPI, Next.js App Router, TypeScript, Python, pytest, existing API proxy utilities

---

### Task 1: Backend contract and parser

**Files:**
- Create: `api/src/services/meeting_notes_service.py`
- Create: `api/tests/test_meeting_notes_service.py`

- [ ] **Step 1: Write the failing parser and config tests**

```python
def test_parse_meeting_notes_json():
    payload = '{"summary":"A","highlights":["B"],"decisions":["C"],"action_items":["D"]}'
    result = parse_meeting_notes_response(payload)
    assert result["summary"] == "A"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest api/tests/test_meeting_notes_service.py -v`
Expected: FAIL because the service module does not exist yet.

- [ ] **Step 3: Write minimal implementation**

Implement config validation, prompt builder, JSON parser, and a generator method that delegates HTTP work to a client abstraction.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest api/tests/test_meeting_notes_service.py -v`
Expected: PASS

### Task 2: Backend endpoint

**Files:**
- Create: `api/src/routers/meeting_notes.py`
- Modify: `api/src/whisper_api.py`
- Modify: `api/tests/test_api_endpoints.py`

- [ ] **Step 1: Write the failing endpoint tests**

```python
def test_generate_meeting_notes_success(client, monkeypatch):
    ...
    response = client.post("/meeting-notes", json={"transcript": "hello"})
    assert response.status_code == 200
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python3 -m pytest api/tests/test_api_endpoints.py -k meeting_notes -v`
Expected: FAIL because the route is missing.

- [ ] **Step 3: Write minimal implementation**

Add request/response models, error mapping, router registration, and service integration.

- [ ] **Step 4: Run test to verify it passes**

Run: `python3 -m pytest api/tests/test_api_endpoints.py -k meeting_notes -v`
Expected: PASS

### Task 3: Frontend proxy route

**Files:**
- Create: `frontend/src/app/api/meeting-notes/route.ts`
- Create: `frontend/src/app/api/meeting-notes/route.test.ts` or equivalent existing test location if frontend tests are present later
- Modify: `frontend/src/lib/api-client.ts`

- [ ] **Step 1: Write the failing route behavior test or minimal request contract check**

If frontend route tests are not set up, document the gap and cover the proxy path with backend/manual verification.

- [ ] **Step 2: Run the available verification**

Run: available frontend test or lint command once dependencies exist.
Expected: FAIL or missing route.

- [ ] **Step 3: Write minimal implementation**

Add a POST route that forwards transcript JSON payloads to `/meeting-notes`.

- [ ] **Step 4: Re-run verification**

Run: available frontend verification command.
Expected: PASS when dependencies are available.

### Task 4: UI integration

**Files:**
- Modify: `frontend/src/app/page.tsx`

- [ ] **Step 1: Write the failing UI-state test if feasible; otherwise define the manual acceptance script before editing**

Manual script:
1. Complete a transcription
2. Click `生成會議記錄`
3. Confirm loading state
4. Confirm four sections render
5. Confirm copy/download/retry work

- [ ] **Step 2: Implement minimal UI changes**

Add:
- meeting-notes tab
- generation state
- error state
- renderers for summary/highlights/decisions/action_items
- copy/download handlers

- [ ] **Step 3: Verify UI behavior**

Run: frontend lint/build command if dependencies exist, plus the manual acceptance flow.
Expected: UI renders without breaking TXT/SRT behavior.

### Task 5: Final verification

**Files:**
- Modify as needed based on failures above

- [ ] **Step 1: Run backend meeting-notes tests**

Run: `python3 -m pytest api/tests/test_meeting_notes_service.py api/tests/test_api_endpoints.py -k meeting_notes -v`

- [ ] **Step 2: Run broader backend regression where feasible**

Run: `python3 -m pytest api/tests/test_api_endpoints.py -v`

- [ ] **Step 3: Run frontend verification when dependencies are available**

Run: `pnpm --filter frontend run lint`

- [ ] **Step 4: Summarize any remaining environment blockers**

Record missing dependencies or unconfigured dev server if they still prevent full verification.
