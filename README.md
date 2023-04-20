# tokmon Beam server

A server that listens for beamed [tokmon](https://github.com/yagil/tokmon) JSON blobs, saves them in a local database, and serves a web UI to explore them.

## Features

- Receive and store beamed tokmon JSON data
- Web UI for exploring usage data

## Installation

1. Clone the repository:
```
git clone https://github.com/yagil/tokmon-beam.git
```

2. Change to the `tokmon-beam` directory:
```
cd tokmon-beam
```

3. Install the required dependencies:
```
pip install -r requirements.txt
```

## Usage

1. Start the server:

```
python server.py
```

2. In your `tokmon` CLI, use the `--beam` option to send data to the server:

```bash
tokmon \
    --beam=all # choose among [all, summary, reqres]
    --json_out=http://localhost:5000
    <your_program_name> [arg1] [arg2] ... [argN]
```

3. Open the web UI in your browser at `http://localhost:5000`.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

