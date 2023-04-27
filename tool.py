#!/usr/bin/env python3

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
    parser.add_argument('command', help='[up|down|build]')
    parser.add_argument('args', nargs=argparse.REMAINDER, help='Arguments for docker-compose')

    args = parser.parse_args()

    # validate command 
    if args.command not in ['up', 'down', 'build']:
        print('Invalid command')
        sys.exit(1)
    
    os.chdir('nextjs-app')
    params = ['docker-compose', args.command] + args.args
    child_process = subprocess.Popen(params)
    child_process.wait()

if __name__ == '__main__':
    main()