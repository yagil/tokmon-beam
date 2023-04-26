# `tokmon --beam` 🔤🧐⚡️
> [tokmon](https://github.com/yagil/tokmon) is a CLI utility to monitor your program or script's OpenAI API token usage.<br>

Using the server in this repo, you can save `tokmon` usage data in a database (local or remote), and explore it in web UI running from `localhost` (updates in real time).

<div align="center">
  <img valign="middle" src="https://user-images.githubusercontent.com/3611042/234407215-63afba38-6356-4ba6-bba1-4d46acfb72b2.png" width="50%" />
  <img valign="middle" src="https://user-images.githubusercontent.com/3611042/234406254-d6299348-d428-43ec-8921-c779d7b82b79.png" width="46%" /> 
</div>

## Features
- Store tokmon JSON data in a Postgres database (local or remote, configurable in the `.env` file)
- Web UI for exploring usage data (updates in real time)
- Export data as JSON from the web UI
- Runs on localhost

## Installation
1. Install the `tokmon` CLI from PyPi
```bash
pip install tokmon
```

2. Clone this repository:
```bash
git clone https://github.com/yagil/tokmon-beam.git && cd tokmon-beam
```

3. Navigate to the `nextjs-app` directory:
```bash
cd nextjs-app
```

4. Create a local copy of the `.env` file
```bash
cp .env.example .env
```

5. Start the `tokmon beam` stack using Docker:

```bash
# Make sure you're in 'nextjs-app/' folder!
docker-compose up
```

6. Create a symlink and an permanent alias to easy turn the beam server on and off no matter where you are in the filesystem:

```bash
# Make sure you're in 'nextjs-app/' folder!
ln -s $(pwd)/tool.py /usr/local/bin/tokmon-beam
```




5. Head to `localhost:9000` in your browser

## Usage
Setup the tokmon beam stack as described above, and then:

1. Add the `--beam` flag to your `tokmon` incantation:

```bash
$ tokmon --beam localhost:9000 <program name> [arg1] [arg2] ...
```

API usage data (including tokens sent and received) will update in real time in the web UI.

The data will persist across docker restarts.

## Components
- NextJS app (listen for incoming JSON blobs from `tokmon` + serve web UI)
- PostgreSQL database
- Websocket server (for real time updates)

## `nextjs-app/.env`

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

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.

