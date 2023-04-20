# tokmon beam

A Beam server is a program that listens for incoming [tokmon](https://github.com/yagil/tokmon) JSON blobs, and serves a web UI to explore usage data using Next.js and TypeScript.

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
npm install
```

## Usage

1. Start the development server:

```
npm run dev
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

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.

