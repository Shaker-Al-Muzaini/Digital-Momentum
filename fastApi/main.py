import uvicorn
from fastapi import FastAPI
from fastapi.responses import PlainTextResponse

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)


@app.get("/", response_class=PlainTextResponse)
async def home() -> str:
    return "Fast Api run"


def dev() -> None:
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
