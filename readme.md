# Cloudflare Agent

## Prerequisites

Ensure you have the following set up:

1. **[Bun](https://bun.sh)**: Install via:
   ```sh
   curl https://bun.sh/install | bash
   ```
2. Node.js, npm, or Yarn is not required as Bun serves as an all-in-one runtime.
3. Secretlist is utilized to reduce likelihood of unexpected credential leakage

## functionalities

1. Create characters: POST /create-character
2. List all characters (both default and custom): GET /characters
3. Delete custom characters: DELETE /characters/:name
4. Generate responses with any character: POST /generate

### structure

```
├── api
│ ├── hosted-api.ts
│ └── openapi.json
├── characters
│ ├── stitch.character.json
│ └── template.character.json
├── config
│ └── models.config.ts
├── index.ts
├── modules
│ └── send-cast.ts
├── services
│ ├── ai.service.ts
│ ├── chat.service.ts
│ ├── proxy.service.ts
│ └── fxn.service.ts
└── types.ts
```

## getting started

### add dependencies

```sh
bun install
```

dependencies listed

```sh
bun add hono viem openapi3-ts openai @cloudflare/workers-types @types/bun @scalar/hono-api-reference
bun add -D secretlint @secretlint/secretlint-rule-preset-recommend
bunx secretlint --init
```

### add cloudflare secrets

add cloudfrlare secrets using terminal/commandline

```sh
bunx wrangler secret put CF_WORKERS_ID
bunx wrangler secret put CF_WORKERS_AI_KEY
bunx wrangler secret put CF_AI_GATEWAY_ID
bunx wrangler secret put CF_AI_GATE_KEY
bunx wrangler secret put OPENAI_API_KEY
bunx wrangler secret put OPENROUTER_API_KEY
bunx wrangler secret put GROK_API_KEY
bunx wrangler secret put FARCASTER_FID
bunx wrangler secret put FARCASTER_NEYNAR_API_KEY
bunx wrangler secret put FARCASTER_NEYNAR_SIGNER_UUID
bunx wrangler secret put EVM_PRIVATE_KEY
bunx wrangler secret put TWITTER_USERNAME
bunx wrangler secret put TWITTER_USERNAME
bunx wrangler secret put TWITTER_EMAIL
```

### create kv namespace

create a kv namespace to store your respective character file

```sh
bunx wrangler kv namespace create "CHARACTERS"
```

copy "namespace binding" output from your terminal/commandline to your `wrangler.toml`

```
[[kv_namespaces]]
binding = "CHARACTERS"
id = "your_respective_id_goes_here"
```

### deploy

```sh
bunx wrangler deploy
```

## usage

### generate character with prompt

```sh
curl -X POST http://localhost:8787/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello", "characterName": "optional_character_name"}'
```

### create character programmatically

```sh
curl -X POST http://localhost:8787/create-character \
  -H "Content-Type: application/json" \
  -d '{
    "name": "newCharacter",
    "modelProvider": "@cf/meta/llama-2-7b-chat-int8",
    "character": {
      "settings": { "voice": { "model": "en_US-male-playful" } },
      "bio": ["Your character bio"],
      "lore": ["Character lore"],
      "knowledge": ["Character knowledge"],
      "style": {
        "all": ["style1", "style2"],
        "chat": ["chat1", "chat2"],
        "post": ["post1", "post2"]
      },
      "adjectives": ["adj1", "adj2"]
    }
  }'
```

### create a character example

```sh
curl -X POST http://localhost:8787/create-character \
  -H "Content-Type: application/json" \
  -d '{
    "name": "newAgent",
    "modelProvider": "@cf/meta/llama-2-7b-chat-int8",
    "character": {
      "settings": {"voice": {"model": "en_US-male-playful"}},
      "bio": ["Custom AI agent bio"],
      "lore": ["Custom lore"],
      "knowledge": ["Custom knowledge"],
      "style": {
        "all": ["style1", "style2"],
        "chat": ["chat1", "chat2"],
        "post": ["post1", "post2"]
      },
      "adjectives": ["adj1", "adj2"]
    }
  }'
```

#### delete a character

```sh
curl -X DELETE http://localhost:8787/characters/newAgent
```
