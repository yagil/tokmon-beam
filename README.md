# `tokmon beam` 🔤🧐⚡️
> **Note** This is alpha software under active development. Expect breaking changes.

**tokmon beam** is a self-hosted, real-time web UI + db for monitoring your program's OpenAI token usage.<br>

It works together with [`tokmon`](https://github.com/yagil/tokmon), which is a CLI utility you can prepend to your program invocation to monitor its OpenAI API token usage.<br>

## Who is this for?
If you're developing apps, websites, or scripts that make calls to the OpenAI API, you might be interested in keeping track of how much various flows in your app actually cost.<br>

## Features
- Real time web UI for exploring your Open API usage data
- Store [`tokmon`](https://github.com/yagil/tokmon) JSON data in a Postgres database (local or remote, configurable in the `.env` file)
- Export data as JSON from the web UI
- Runs on `localhost`

## Demo
<div align="center">
  <video src="https://user-images.githubusercontent.com/3611042/234463513-d7a0c074-21a7-426e-a547-2a2f0fba5105.mp4" />
</div>

## Installation
**Note:** `tokmon beam` uses docker. If you don't have docker on your machine, install it first.

1. Install the `tokmon` CLI from PyPi
```bash
pip install --upgrade tokmon
```

2. Clone this repository and `cd` into the root directory:
```bash
git clone https://github.com/yagil/tokmon-beam.git && cd tokmon-beam
```

3. Create your local copy of the `.env` file
```bash
# The .env file needs to be inside the 'nextjs-app/' folder
cp nextjs-app/.env.example nextjs-app/.env
```

4. Start the `tokmon beam` stack (wraps docker-compose)

```bash
$ python3 tool.py build # run this after pulling a new version of this repo
$ python3 tool.py up
```

5. Head to `localhost:9000` in your browser

## Usage
> **Warning**
> This is a debugging tool. It is not intended to be used in any consequential setting. Use your best judgement!
Setup the tokmon beam stack as described above, and then:

1. Run the `tokmon beam` server if it's not already running:

```bash
$ cd /path/to/local/repo/
$ python3 tool.py up
```

2. Head to [`localhost:9000`](localhost:9000) in your browser

3. Run the [`tokmon` CLI](https://github.com/yagil/tokmon) with the `--beam` flag pointing to your tokmon beam server:

```bash
tokmon --no_json --beam localhost:9000 /path/to/your/program [arg1] [arg2] ...
```
4. Logs and usage data will appear up in the web UI and update in real time. 

5. Exit the server with `Ctrl^C`. Run `python3 tool.py down` to clean up the docker related resources.

## Troubleshooting
Keep an eye on the docker logs for any sign of misconfiguration or bugs.

## Configuration parameters in `nextjs-app/.env`
You may change the following parameters in the `.env` file:
```env
# The port the NextJS app will run on
BEAM_SERVER_PORT=9000

# The port the websocket server will run on
WSS_PORT=9001
# The name of the websocket container
WSS_CONTAINER_NAME=tokmon-beam-wss

# Postgres database configuration
POSTGRES_USER=postgres
POSTGRES_PASSWORD=randompassword
POSTGRES_DB=mydb
POSTGRES_PORT=5432

# The connection string for the Postgres database
# Should in theory work for a hosted database as well
DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@localhost:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public
```

## Architecture
### Components
- NextJS app (listen for incoming JSON blobs from `tokmon` + serve web UI)
- PostgreSQL database
- Websocket server (for real time updates)

<img width="450" alt="image" src="https://user-images.githubusercontent.com/3611042/234438167-bd6313df-1211-4fbb-8293-a6489247dd17.png">

> Not drawn: `<your program>` making API calls to `https://api.openai.com`

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.

