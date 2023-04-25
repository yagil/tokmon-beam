# `tokmon --beam` 🔤🧐⚡️
> [tokmon](https://github.com/yagil/tokmon) is a CLI utility to monitor your program or script's OpenAI API token usage.<br>

Using the server in this repo, you can save `tokmon` usage data in a database (local or remote), and explore it in web UI running from `localhost` (updates in real time).

All token data             |  Single chat view
:-------------------------:|:-------------------------:
![](https://user-images.githubusercontent.com/3611042/234407215-63afba38-6356-4ba6-bba1-4d46acfb72b2.png)  |  ![](https://user-images.githubusercontent.com/3611042/234406254-d6299348-d428-43ec-8921-c779d7b82b79.png)

## Features
- Store tokmon JSON data in a Postgres database (local or remote, configurable in the `.env` file)
- Web UI for exploring usage data (updates in real time)
- Export data as JSON from the web UI
- Runs on localhost

## Setup
0. Install `tokmon` from PyPi
```bash
pip install tokmon
```

1. Clone the repository:
```bash
git clone https://github.com/yagil/tokmon-beam.git && cd tokmon-beam
```

2. Navigate to the `nextjs-app` directory:
```bash
cd nextjs-app
```

3. Create a local copy of the `.env` file
```bash
cp .env.example .env
```

4. Start the `tokmon beam` stack using Docker:

```bash
# make sure you're in nextjs-app/ folder
docker-compose up
```

5. Head to `localhost:9000` in your browser

## Usage

1. Add the `--beam` flag to your `tokmon` incantation:

```bash
$ tokmon --beam <program name> [arg1] [arg2] ...
```

Data will update in real time in the web UI.

## Components
- NextJS app (web UI + listening for incoming JSON blobs from `tokmon`)
- PostgreSQL database
- Websocket server for real time UI updates

## License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.

