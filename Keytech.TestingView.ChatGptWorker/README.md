# TestingView ChatGPT Worker

This replaces the browser/DOM-driven ChatGPT extension flow with a C# worker that calls the OpenAI Responses API directly.

## What It Does

- Polls `https://api.testingview.com/gpt/image?symbol=...` with a `user` header
- Buffers screenshots per configured symbol
- Sends the batch to OpenAI using the Responses API and the configured prompt
- Posts the returned analysis to `https://api.testingview.com/notes?symbol=...`
- Removes buffered screenshots through `https://api.testingview.com/gpt/image-remove?symbol=...&filename=...`
- Logs every OpenAI reply to `TestingView:ReplyLogFilePath`

The default model is `gpt-5.6-sol`, OpenAI's current flagship model. On startup the worker lists models available to the API key and prints the loaded `appsettings.json` path with instructions for changing `OpenAI:Model`.

## Configure

`appsettings.json` is parsed with JSON comments enabled, so the checked-in file documents valid/common values beside each OpenAI setting.

Set the API key in `OpenAI:OpenApiKey` in `appsettings.json`.

Set symbols in `appsettings.json`:

```json
"OpenAI": {
  "OpenApiKey": "sk-...",
  "Model": "gpt-5.6-sol"
},
"TestingView": {
  "AcceptedUsers": [ "eBacktesting" ],
  "Symbols": [ "CME_MINI:MNQ1!" ]
}
```

The `/gpt` image endpoints live in `Keytech.TestingView.API`. External clients should post screenshots to `https://api.testingview.com/gpt/analyze-image` and include a `user` header matching one of the values in the API `TestingViewGpt:AcceptedUsers` config. The worker polls those same endpoints for every configured `TestingView:AcceptedUsers` and `TestingView:Symbols` pair.

The API exposes:

- `POST /gpt/analyze-image`
- `GET /gpt/image?symbol=...`
- `POST /gpt/image-remove?symbol=...&filename=...`
- `GET /gpt/image/peek?symbol=...`
- `DELETE /gpt/image?symbol=...`

Example image post:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.testingview.com/gpt/analyze-image" `
  -Headers @{ user = "eBacktesting" } `
  -ContentType "application/json" `
  -Body '{"symbol":"CME_MINI:MNQ1!","imageBase64":"<base64>","fileName":"snapshot.png","mimeType":"image/png"}'
```

Prompts are loaded per user from `Prompts/users/<user>.md`. The current trading instructions are stored as `Prompts/users/eBacktesting.md`. Requests without a `user` header, or with a user not listed in the API `TestingViewGpt:AcceptedUsers` config, are rejected.

The old extension waited until `Prompt Image Count` images were attached before sending the prompt. This worker mirrors that with `TestingView:BatchImageCount`, defaulting to `6`. Set it to `1` if each screenshot should be analyzed immediately.

`Prompts/trading-analysis.md` is the only source for model instructions. It replaces the hidden ChatGPT conversation/custom-instruction state.

Every OpenAI reply is appended to `TestingView:ReplyLogFilePath`, defaulting to `Logs/chatgpt-replies.log`. The worker also posts a progress note when a complete image batch starts processing.

## Run

```powershell
dotnet run --project D:\Proj\Keytech\Sources\Keytech.TestingView\Keytech.TestingView.ChatGptWorker -- --symbol "CME_MINI:MNQ1!"
```

Useful checks:

```powershell
dotnet run --project D:\Proj\Keytech\Sources\Keytech.TestingView\Keytech.TestingView.ChatGptWorker -- --symbol "CME_MINI:MNQ1!" --once --dry-run
dotnet publish D:\Proj\Keytech\Sources\Keytech.TestingView\Keytech.TestingView.ChatGptWorker -c Release -r win-x64 --self-contained false
```

## OpenAI Account Setup

ChatGPT Business and the API platform are billed separately. A ChatGPT Business subscription does not include API usage, so create or use an API organization/project in the OpenAI Platform, add billing/payment there, then create a project API key.

Minimum setup:

1. Open the API Platform: https://platform.openai.com/
2. Create/select the organization and project that should own this worker.
3. Add API billing: https://platform.openai.com/settings/organization/billing/overview
4. Create a project API key: https://platform.openai.com/api-keys
5. Set `OpenAI:OpenApiKey` in `appsettings.json`.
6. Review limits for the project/model and raise spend/rate limits if needed.

For production, run this as a Windows Service or scheduled process with the same `appsettings.json` deployed beside the executable.
