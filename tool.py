import os
import sys
import subprocess
import argparse
import signal

def main():
    child_process = None
    def signal_handler(signal, frame):
        child_process.send_signal(signal)
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    parser = argparse.ArgumentParser(description='tokmon-beam')
    parser.add_argument('command', help='[up|down]')
    parser.add_argument('args', nargs=argparse.REMAINDER, help='Arguments for docker-compose')
    parser.add_argument('-h', '--help', action='help', help='Show this help message and exit')

    args = parser.parse_args()

    if args.command == 'up':
        print('Starting tokmon-beam...')
        os.chdir('nextjs-app')
        params = ['docker-compose', 'up'] + args.args
        child_process = subprocess.Popen(params)
    elif args.command == 'down':
        print('Stopping tokmon-beam...')
        os.chdir('nextjs-app')
        child_process = subprocess.Popen(['docker-compose', 'down'])

    else:
        print('Invalid command')
        sys.exit(1)

    child_process.wait()

if __name__ == '__main__':
    main()