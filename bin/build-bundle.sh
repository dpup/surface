#!/bin/bash
# Shell script for building the stand alone bundle.
# Pipe stdout to wherever you want the bundle saved.

DIR="$( cd -P "$( dirname "$0" )" && pwd )"
cd $DIR
java -jar ./plovr.jar build \
    ./plovr-config-bundle.js
