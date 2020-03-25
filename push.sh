#!/bin/bash

node scripts/lib/build
rm -r release
mkdir release
cp index.html release/index.html
cp README.txt release/README.txt
~/Applications/butler push ~/Repositories/Hundredrabbits/Noodle/release hundredrabbits/noodle:main
~/Applications/butler status hundredrabbits/noodle
rm -r release